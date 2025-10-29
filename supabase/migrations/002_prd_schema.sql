-- PRD Schema: enums, tables, triggers, RLS (profiles, designs, audit_log, settings)

-- Enums
DO $$ BEGIN
  CREATE TYPE role_enum AS ENUM ('ADMIN','DESIGNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE design_status_enum AS ENUM ('BACKLOG','IN_PROGRESS','TO_REVIEW','DELIVERED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role role_enum NOT NULL DEFAULT 'DESIGNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  player TEXT NOT NULL,
  match_home TEXT NOT NULL,
  match_away TEXT NOT NULL,
  folder_url TEXT,
  deadline_at TIMESTAMPTZ NOT NULL,
  status design_status_enum NOT NULL DEFAULT 'BACKLOG',
  designer_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_designs_deadline ON public.designs(deadline_at);
CREATE INDEX IF NOT EXISTS idx_designs_designer ON public.designs(designer_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_designs_updated_at BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- audit trigger (minimal diff)
CREATE OR REPLACE FUNCTION public.log_design_audit()
RETURNS TRIGGER AS $$
DECLARE
  old_row JSONB;
  new_row JSONB;
  diff JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(actor_id, entity, entity_id, action, payload)
    VALUES (auth.uid(), 'designs', NEW.id, 'CREATE', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_row := to_jsonb(OLD);
    new_row := to_jsonb(NEW);
    diff := jsonb_strip_nulls(
      jsonb_build_object(
        'status_old', old_row->'status', 'status_new', new_row->'status',
        'designer_old', old_row->'designer_id', 'designer_new', new_row->'designer_id'
      )
    );
    INSERT INTO public.audit_log(actor_id, entity, entity_id, action, payload)
    VALUES (auth.uid(), 'designs', NEW.id, 'UPDATE', diff);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_designs_audit
  AFTER INSERT OR UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.log_design_audit();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper check: is admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- profiles policies
DO $$ BEGIN
  CREATE POLICY profiles_owner_admin_sel ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_owner_admin_upd ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- designs policies
DO $$ BEGIN
  CREATE POLICY designs_read ON public.designs
  FOR SELECT USING (
    designer_id = auth.uid() OR public.is_admin(auth.uid()) OR true -- vista general read-only
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY designs_update_designer ON public.designs
  FOR UPDATE USING (designer_id = auth.uid())
  WITH CHECK (status <> 'DELIVERED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY designs_admin_all ON public.designs
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- audit_log policy (admin only)
DO $$ BEGIN
  CREATE POLICY audit_admin_sel ON public.audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


