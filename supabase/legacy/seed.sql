-- Seed Data for PH Sport Dashboard

-- Insert asset types
INSERT INTO public.asset_types (key, label, default_deadline_offset_hours) VALUES
  ('matchday', 'Matchday', 24),
  ('result', 'Resultado', 1),
  ('mom', 'MVP', 2),
  ('social', 'Redes Sociales', 12),
  ('poster', 'Póster', 48)
ON CONFLICT (key) DO NOTHING;

-- Create demo users (these will be created via Supabase Auth, but we add metadata here)
-- Note: In production, users are created via auth.signup() and their data is synced here

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


