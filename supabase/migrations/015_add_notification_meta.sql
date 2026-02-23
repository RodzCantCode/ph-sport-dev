-- ========================================
-- MIGRATION 015: Add Metadata to Notifications
-- ========================================
-- Adds a JSONB metadata payload to support richer email copy
-- without breaking existing title/message behavior.

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS meta jsonb;

COMMENT ON COLUMN public.notifications.meta IS
  'Optional structured metadata for notifications (e.g. assignment_count, design_title).';
