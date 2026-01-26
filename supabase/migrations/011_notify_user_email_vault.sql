-- Use Vault secrets for notification email trigger

create or replace function public.notify_user_email()
returns trigger
language plpgsql
security definer
as $$
declare
  project_url text;
  anon_key text;
begin
  select decrypted_secret
    into project_url
    from vault.decrypted_secrets
    where name = 'notify_email_project_url'
    limit 1;

  select decrypted_secret
    into anon_key
    from vault.decrypted_secrets
    where name = 'notify_email_anon_key'
    limit 1;

  if project_url is null or anon_key is null then
    return NEW;
  end if;

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
