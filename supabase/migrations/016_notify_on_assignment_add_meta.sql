-- ========================================
-- MIGRATION 016: notify_on_assignment metadata
-- ========================================
-- Enriches assignment notifications with structured metadata.

CREATE OR REPLACE FUNCTION public.notify_on_assignment()
RETURNS trigger AS $$
BEGIN
  -- Si el flag de supresión está activo, saltar notificación
  -- (usado en batch inserts donde se genera notificación agregada manual)
  IF NEW.suppress_assignment_notification = true THEN
    -- Resetear el flag para futuras reasignaciones
    NEW.suppress_assignment_notification := false;
    RETURN NEW;
  END IF;

  -- En INSERT: notificar si hay designer_id
  IF TG_OP = 'INSERT' THEN
    IF NEW.designer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/communications/' || NEW.id,
        jsonb_build_object(
          'assignment_count', 1,
          'design_title', COALESCE(NEW.title, 'Sin título')
        )
      );
    END IF;
  END IF;

  -- En UPDATE: notificar solo si designer_id cambió
  IF TG_OP = 'UPDATE' THEN
    IF NEW.designer_id IS NOT NULL AND
       (OLD.designer_id IS NULL OR OLD.designer_id != NEW.designer_id) THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/communications/' || NEW.id,
        jsonb_build_object(
          'assignment_count', 1,
          'design_title', COALESCE(NEW.title, 'Sin título')
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_assignment ON public.designs;
CREATE TRIGGER trigger_notify_on_assignment
  BEFORE INSERT OR UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_assignment();
