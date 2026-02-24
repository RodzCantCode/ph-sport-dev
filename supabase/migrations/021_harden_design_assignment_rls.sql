-- ========================================
-- MIGRATION 021: Harden design assignment updates
-- ========================================
-- Prevents non-admin users from changing designer_id while
-- preserving status updates on their own designs.

-- Remove overly permissive/legacy update policies if present
DROP POLICY IF EXISTS designs_update_all ON public.designs;
DROP POLICY IF EXISTS designs_update_designer ON public.designs;
DROP POLICY IF EXISTS designs_update_designer_safe ON public.designs;

-- Designers can update only their own rows and must keep designer_id as self
CREATE POLICY designs_update_designer_safe ON public.designs
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND designer_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND designer_id = auth.uid()
  );

-- Defense in depth: block designer_id reassignment for authenticated non-admins
CREATE OR REPLACE FUNCTION public.prevent_non_admin_designer_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.designer_id IS DISTINCT FROM NEW.designer_id
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change designer assignment'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_non_admin_designer_reassignment ON public.designs;
CREATE TRIGGER trg_prevent_non_admin_designer_reassignment
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_admin_designer_reassignment();
