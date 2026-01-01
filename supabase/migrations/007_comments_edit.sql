-- ========================================
-- MIGRATION 007: Comments Edit Feature
-- ========================================
-- Permite a los usuarios editar sus propios comentarios
-- dentro de los primeros 15 minutos de creación.

-- ========================================
-- COLUMNA: updated_at
-- ========================================
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- ========================================
-- TRIGGER: Auto-actualizar updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_updated_at();

-- ========================================
-- RLS POLICY: Update (solo autor + 15 min)
-- ========================================
-- Solo el autor puede editar su comentario
-- y solo dentro de los primeros 15 minutos

CREATE POLICY "Users can update own comments within 15 minutes"
  ON comments FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND created_at > now() - interval '15 minutes'
  )
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ✅ MIGRACIÓN 007 COMPLETADA
-- ========================================
