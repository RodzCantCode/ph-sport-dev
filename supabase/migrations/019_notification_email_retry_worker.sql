-- ========================================
-- MIGRATION 019: Notification email retry worker
-- ========================================
-- Adds a retry dispatcher and schedules it every minute with pg_cron.

create or replace function public.retry_notification_email_deliveries(p_limit integer default 25)
returns integer
language plpgsql
security definer
as $$
declare
  v_delivery_id uuid;
  v_processed integer := 0;
begin
  for v_delivery_id in
    select d.id
    from public.notification_email_deliveries d
    where d.attempt_count < 3
      and (
        (
          d.status in ('queued', 'failed', 'timeout')
          and (d.next_retry_at is null or d.next_retry_at <= now())
        )
        or (
          d.status = 'sending'
          and d.last_attempt_at is not null
          and d.last_attempt_at <= now() - interval '2 minutes'
        )
      )
    order by coalesce(d.next_retry_at, d.created_at) asc
    limit p_limit
  loop
    perform public.dispatch_notification_email(v_delivery_id, 20000);
    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
    from cron.job
    where jobname = 'notification-email-retry-every-minute'
    limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'notification-email-retry-every-minute',
    '* * * * *',
    $job$select public.retry_notification_email_deliveries();$job$
  );
end;
$$;
