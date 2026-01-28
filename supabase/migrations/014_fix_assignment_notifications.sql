-- ========================================
-- MIGRATION 014: Fix Assignment Notifications
-- ========================================
-- Corrige el flujo de notificaciones de asignación:
-- 1. notify_on_assignment() ahora soporta INSERT y UPDATE correctamente
-- 2. Añade flag para suprimir notificación en batch inserts
-- 3. notify_user_email() registra warnings cuando faltan secrets

-- ========================================
-- SCHEMA: Add suppress flag to designs
-- ========================================
ALTER TABLE public.designs 
ADD COLUMN IF NOT EXISTS suppress_assignment_notification boolean DEFAULT false;

COMMENT ON COLUMN public.designs.suppress_assignment_notification IS 
  'Flag temporal para evitar notificación automática en batch inserts. Se usa junto con notificación agregada manual.';

-- ========================================
-- FUNCTION: notify_on_assignment (fixed)
-- ========================================
-- Soporta INSERT y UPDATE, respeta suppress flag, y usa link consistente.

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
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/communications/' || NEW.id
      );
    END IF;
  END IF;

  -- En UPDATE: notificar solo si designer_id cambió
  IF TG_OP = 'UPDATE' THEN
    IF NEW.designer_id IS NOT NULL AND 
       (OLD.designer_id IS NULL OR OLD.designer_id != NEW.designer_id) THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/communications/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger para INSERT y UPDATE
DROP TRIGGER IF EXISTS trigger_notify_on_assignment ON public.designs;
CREATE TRIGGER trigger_notify_on_assignment
  BEFORE INSERT OR UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_assignment();

-- ========================================
-- FUNCTION: notify_user_email (with logging)
-- ========================================
-- Agrega warnings cuando faltan secrets para facilitar diagnóstico.

CREATE OR REPLACE FUNCTION public.notify_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text;
  auth_key text;
BEGIN
  SELECT decrypted_secret
    INTO project_url
    FROM vault.decrypted_secrets
    WHERE name = 'notify_email_project_url'
    LIMIT 1;

  SELECT decrypted_secret
    INTO auth_key
    FROM vault.decrypted_secrets
    WHERE name = 'notify_email_service_role_key'
    LIMIT 1;

  IF auth_key IS NULL THEN
    SELECT decrypted_secret
      INTO auth_key
      FROM vault.decrypted_secrets
      WHERE name = 'notify_email_anon_key'
      LIMIT 1;
  END IF;

  -- Registrar warning si faltan secrets (visible en logs de Supabase)
  IF project_url IS NULL THEN
    RAISE WARNING '[notify_user_email] Missing secret: notify_email_project_url';
  END IF;
  
  IF auth_key IS NULL THEN
    RAISE WARNING '[notify_user_email] Missing secret: notify_email_service_role_key or notify_email_anon_key';
  END IF;

  IF project_url IS NULL OR auth_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_key
    ),
    body := row_to_json(NEW)::jsonb
  );

  RETURN NEW;
END;
$$;

-- ========================================
-- ✅ MIGRATION 014 COMPLETED
-- ========================================
