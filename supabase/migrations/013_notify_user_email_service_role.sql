-- Prefer service role key for notification emails, fallback to anon

create or replace function public.notify_user_email()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text;
  auth_key text;
begin
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
    return NEW;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_key
    ),
    body := row_to_json(NEW)::jsonb
  );

  return NEW;
end;
$$;
