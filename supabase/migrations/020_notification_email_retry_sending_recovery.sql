-- ========================================
-- MIGRATION 020: Retry recovery for stale sending state
-- ========================================
-- Allows retries when a delivery remains in "sending" for too long
-- (e.g. caller timeout ambiguity before edge function updates status).

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
