-- ========================================
-- PH SPORT DASHBOARD - DATABASE SETUP
-- ========================================
-- Este script crea toda la estructura de base de datos necesaria
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- MIGRATION 001: Initial Schema
-- ========================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('designer', 'manager', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  opponent TEXT NOT NULL,
  competition TEXT NOT NULL,
  drive_folder_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset types table
CREATE TABLE IF NOT EXISTS public.asset_types (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  default_deadline_offset_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  type_id INTEGER REFERENCES public.asset_types(id),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'blocked')) DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  drive_folder_id TEXT,
  drive_file_url TEXT,
  blocked_reason TEXT,
  preview_url TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgent')) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals table
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  comment TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events log table
CREATE TABLE IF NOT EXISTS public.events_log (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL CHECK (entity IN ('asset', 'match', 'approval')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_match_id ON public.assets(match_id);
CREATE INDEX IF NOT EXISTS idx_assets_assignee_id ON public.assets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date);
CREATE INDEX IF NOT EXISTS idx_approvals_asset_id ON public.approvals(asset_id);
CREATE INDEX IF NOT EXISTS idx_events_log_entity ON public.events_log(entity, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- MIGRATION 002: PRD Schema (Designs)
-- ========================================

-- Enums
DO $$ BEGIN
  CREATE TYPE role_enum AS ENUM ('ADMIN','DESIGNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE design_status_enum AS ENUM ('BACKLOG','DELIVERED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles table (para el sistema de diseños)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role role_enum NOT NULL DEFAULT 'DESIGNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Designs table
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

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Indexes for designs
CREATE INDEX IF NOT EXISTS idx_designs_deadline ON public.designs(deadline_at);
CREATE INDEX IF NOT EXISTS idx_designs_designer ON public.designs(designer_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);

-- updated_at trigger for profiles
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

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: is admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- Profiles policies
DO $$ BEGIN
  CREATE POLICY profiles_owner_admin_sel ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_owner_admin_upd ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Designs policies
DO $$ BEGIN
  CREATE POLICY designs_read ON public.designs
  FOR SELECT USING (
    designer_id = auth.uid() OR public.is_admin(auth.uid()) OR true
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

-- Audit log policy (admin only)
DO $$ BEGIN
  CREATE POLICY audit_admin_sel ON public.audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================
-- SEED DATA
-- ========================================

-- Insert asset types
INSERT INTO public.asset_types (key, label, default_deadline_offset_hours) VALUES
  ('matchday', 'Matchday', 24),
  ('result', 'Resultado', 1),
  ('mom', 'MVP', 2),
  ('social', 'Redes Sociales', 12),
  ('poster', 'Póster', 48)
ON CONFLICT (key) DO NOTHING;

-- Insert a demo match (will be linked to actual users later)
INSERT INTO public.matches (id, date, opponent, competition, notes, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE + INTERVAL '7 days', 'Real Madrid CF', 'La Liga', 'Partido de prueba para testing', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo assets for the match
INSERT INTO public.assets (id, match_id, type_id, status, priority, deadline, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 1, 'pending', 'normal', NOW() + INTERVAL '7 days', NOW()),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 2, 'pending', 'urgent', NOW() + INTERVAL '1 day', NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 3, 'in_progress', 'normal', NOW() + INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- ✅ SETUP COMPLETADO
-- ========================================
-- Si viste "Success. No rows returned", ¡todo está listo!
-- Siguiente paso: crear tu primer usuario admin (ver SETUP_INSTRUCTIONS.md)
