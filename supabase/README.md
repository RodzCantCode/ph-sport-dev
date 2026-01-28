Supabase setup

This folder is the source of truth for the database schema and setup.
Use migrations in `supabase/migrations/` for all environments.

Quick start
1) Configure env vars in `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_DEMO_MODE=true
```

2) Apply migrations (recommended)
```
# local
supabase db reset

# remote (if linked)
supabase db push
```

3) Optional: seed data (demo)
- `supabase/legacy/seed.sql` contains demo data only.

Vault secrets for notification emails
These are required by the database trigger that calls the Edge Function.
```
select vault.create_secret('https://<project-ref>.supabase.co', 'notify_email_project_url');
select vault.create_secret('<anon-key>', 'notify_email_anon_key');
```

Legacy/manual setup
For one-off manual setups only, use `supabase/legacy/SETUP_DATABASE.sql` in the SQL Editor.
Do not use it for ongoing schema changes.

Files
- `supabase/migrations/`: schema history (authoritative)
- `supabase/legacy/`: reference-only scripts
