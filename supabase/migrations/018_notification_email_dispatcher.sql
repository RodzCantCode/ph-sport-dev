-- ========================================
-- MIGRATION 018: Notification email dispatcher + trigger update
-- ========================================
-- Adds dispatch helpers with 20s timeout and enriches payload
-- with delivery metadata for idempotent tracking.

create or replace function public.notification_email_retry_delay(p_attempt_count integer)
returns interval
language sql
immutable
as $$
  select case
    when p_attempt_count <= 1 then interval '1 minute'
    when p_attempt_count = 2 then interval '5 minutes'
    else interval '15 minutes'
  end;
$$;

create or replace function public.dispatch_notification_email(
  p_delivery_id uuid,
  p_timeout_milliseconds integer default 20000
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_delivery public.notification_email_deliveries%rowtype;
  v_notification public.notifications%rowtype;
  project_url text;
  auth_key text;
  v_attempt integer := 0;
begin
  select *
    into v_delivery
    from public.notification_email_deliveries
    where id = p_delivery_id
    for update;

  if not found then
    return false;
  end if;

  if v_delivery.status = 'sent' then
    return true;
  end if;

  if v_delivery.attempt_count >= 3 then
    update public.notification_email_deliveries
      set status = 'failed',
          last_error = coalesce(last_error, 'Max attempts reached'),
          next_retry_at = null,
          updated_at = now()
      where id = p_delivery_id;
    return false;
  end if;

  select *
    into v_notification
    from public.notifications
    where id = v_delivery.notification_id;

  if not found then
    update public.notification_email_deliveries
      set status = 'failed',
          last_error = 'Notification not found',
          next_retry_at = null,
          updated_at = now()
      where id = p_delivery_id;
    return false;
  end if;

  v_attempt := v_delivery.attempt_count + 1;

  update public.notification_email_deliveries
    set status = 'sending',
        attempt_count = v_attempt,
        last_attempt_at = now(),
        next_retry_at = now() + public.notification_email_retry_delay(v_attempt),
        last_error = null,
        updated_at = now()
    where id = p_delivery_id;

  select decrypted_secret
    into project_url
    from vault.decrypted_secrets
    where name = 'notify_email_project_url'
    limit 1;

  select decrypted_secret
    into auth_key
    from vault.decrypted_secrets
    where name = 'notify_email_service_role_key'
    limit 1;

  if auth_key is null then
    select decrypted_secret
      into auth_key
      from vault.decrypted_secrets
      where name = 'notify_email_anon_key'
      limit 1;
  end if;

  if project_url is null or auth_key is null then
    update public.notification_email_deliveries
      set status = 'failed',
          last_error = 'Missing notify_email_project_url or auth key secret',
          next_retry_at = null,
          updated_at = now()
      where id = p_delivery_id;
    return false;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_key
    ),
    body := row_to_json(v_notification)::jsonb || jsonb_build_object(
      'delivery_id', p_delivery_id,
      'idempotency_key', v_delivery.idempotency_key
    ),
    timeout_milliseconds := p_timeout_milliseconds
  );

  return true;
exception
  when others then
    update public.notification_email_deliveries
      set status = 'failed',
          last_error = left(sqlerrm, 1000),
          next_retry_at = case
            when v_attempt > 0 and v_attempt < 3 then now() + public.notification_email_retry_delay(v_attempt)
            else null
          end,
          updated_at = now()
      where id = p_delivery_id;
    return false;
end;
$$;

-- Prefer service role key for notification emails, fallback to anon
create or replace function public.notify_user_email()
returns trigger
language plpgsql
security definer
as $$
declare
  v_delivery_id uuid;
  v_idempotency_key text;
begin
  v_idempotency_key := 'notification:' || NEW.id::text || ':email';

  insert into public.notification_email_deliveries (
    notification_id,
    user_id,
    status,
    attempt_count,
    idempotency_key,
    next_retry_at
  )
  values (
    NEW.id,
    NEW.user_id,
    'queued',
    0,
    v_idempotency_key,
    now()
  )
  on conflict (idempotency_key)
  do update set
    user_id = excluded.user_id,
    updated_at = now()
  returning id into v_delivery_id;

  perform public.dispatch_notification_email(v_delivery_id, 20000);
  return NEW;
end;
$$;
