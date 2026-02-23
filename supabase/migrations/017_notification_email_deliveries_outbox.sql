-- ========================================
-- MIGRATION 017: Notification email deliveries outbox
-- ========================================
-- Stores delivery lifecycle for notification emails to provide
-- traceability, idempotency, and retry orchestration.

create table if not exists public.notification_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('queued', 'sending', 'sent', 'failed', 'timeout', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  idempotency_key text not null,
  provider_message_id text,
  last_error text,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key),
  unique (notification_id)
);

create index if not exists notification_email_deliveries_status_next_retry_idx
  on public.notification_email_deliveries (status, next_retry_at);

create index if not exists notification_email_deliveries_user_created_idx
  on public.notification_email_deliveries (user_id, created_at desc);

create index if not exists notification_email_deliveries_notification_idx
  on public.notification_email_deliveries (notification_id);

comment on table public.notification_email_deliveries is
  'Outbox + delivery tracking for notification emails.';

comment on column public.notification_email_deliveries.idempotency_key is
  'Unique key to ensure one logical email delivery per notification.';
