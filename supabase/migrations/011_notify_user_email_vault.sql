-- Use Vault secrets for notification email trigger

create or replace function public.notify_user_email()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text := (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'notify_email_project_url'
    limit 1
  );
  anon_key text := (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'notify_email_anon_key'
    limit 1
  );
begin
  perform net.http_post(
    url := project_url || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := row_to_json(NEW)::jsonb
  );

  return NEW;
end;
$$;

drop trigger if exists on_notification_insert on public.notifications;
create trigger on_notification_insert
  after insert on public.notifications
  for each row execute function public.notify_user_email();
