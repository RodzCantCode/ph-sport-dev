-- Improve RLS policy for better Realtime support
-- Drop the old policy and recreate with explicit role specification

DROP POLICY IF EXISTS "Users can view all comments" ON comments;

-- Recreate with explicit TO authenticated for better realtime performance
CREATE POLICY "Users can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);
