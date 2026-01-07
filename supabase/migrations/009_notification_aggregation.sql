-- ========================================
-- MIGRATION 009: Notification Aggregation
-- ========================================
-- Adds support for aggregated notifications per conversation
-- to avoid flooding users with one notification per message.

-- ========================================
-- SCHEMA: Add reference_id for grouping
-- ========================================
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS reference_id uuid;

-- Index for fast UPSERT lookups (unread notifications by user+type+reference)
CREATE INDEX IF NOT EXISTS notifications_aggregation_idx 
ON public.notifications(user_id, type, reference_id) 
WHERE read = false;

-- ========================================
-- FUNCTION: Aggregated comment notifications
-- ========================================
-- Replaces the old notify_on_comment function with UPSERT logic.
-- Notifies: designer_id, created_by, and all ADMINs (excluding author).

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid;
  commenter_name text;
  design_record record;
  existing_notification_id uuid;
  new_unread_count int;
BEGIN
  -- Get design info
  SELECT id, title, designer_id, created_by 
  INTO design_record
  FROM public.designs WHERE id = NEW.design_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name
  FROM public.profiles WHERE id = NEW.user_id;

  -- Loop through all target users
  FOR target_user_id IN
    SELECT DISTINCT p.id FROM public.profiles p
    WHERE (
      p.id = design_record.designer_id 
      OR p.id = design_record.created_by
      OR p.role = 'ADMIN'
    )
    AND p.id != NEW.user_id  -- Exclude the comment author
  LOOP
    -- Check if there's an existing unread notification for this user+design
    SELECT id INTO existing_notification_id
    FROM public.notifications
    WHERE user_id = target_user_id
      AND type = 'comment'
      AND reference_id = NEW.design_id
      AND read = false
    LIMIT 1;

    IF existing_notification_id IS NOT NULL THEN
      -- UPDATE existing notification: count unread messages
      SELECT COUNT(*) INTO new_unread_count
      FROM public.comments c
      LEFT JOIN public.message_read_status mrs 
        ON mrs.comment_id = c.id AND mrs.user_id = target_user_id
      WHERE c.design_id = NEW.design_id 
        AND mrs.id IS NULL
        AND c.user_id != target_user_id;

      UPDATE public.notifications
      SET 
        message = new_unread_count::text || ' mensajes nuevos en "' || COALESCE(design_record.title, 'un diseño') || '"',
        created_at = now()
      WHERE id = existing_notification_id;
    ELSE
      -- INSERT new notification
      INSERT INTO public.notifications 
        (user_id, type, title, message, link, reference_id, read)
      VALUES (
        target_user_id,
        'comment',
        'Nuevo mensaje',
        COALESCE(commenter_name, 'Alguien') || ' comentó en "' || COALESCE(design_record.title, 'un diseño') || '"',
        '/communications/' || NEW.design_id,
        NEW.design_id,
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (no change to trigger itself, just ensures it uses new function)
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- ========================================
-- ✅ MIGRATION 009 COMPLETED
-- ========================================
