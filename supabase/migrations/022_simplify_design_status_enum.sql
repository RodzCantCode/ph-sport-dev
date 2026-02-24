-- ========================================
-- MIGRATION 022: Simplify design statuses
-- ========================================
-- Keep only BACKLOG and DELIVERED as valid states.

-- Normalize any legacy statuses before changing enum type.
UPDATE public.designs
SET status = 'BACKLOG'::public.design_status_enum
WHERE status::text IN ('IN_PROGRESS', 'TO_REVIEW');

-- Recreate enum with only the two active statuses.
DROP TYPE IF EXISTS public.design_status_enum_v2;
CREATE TYPE public.design_status_enum_v2 AS ENUM ('BACKLOG', 'DELIVERED');

ALTER TABLE public.designs
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.design_status_enum_v2
    USING status::text::public.design_status_enum_v2,
  ALTER COLUMN status SET DEFAULT 'BACKLOG';

DROP TYPE public.design_status_enum;
ALTER TYPE public.design_status_enum_v2 RENAME TO design_status_enum;
