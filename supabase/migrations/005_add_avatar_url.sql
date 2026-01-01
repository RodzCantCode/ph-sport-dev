-- Add avatar_url to profiles table
alter table profiles 
add column if not exists avatar_url text;

-- Update RLS to allow users to update their own avatar (already covered by existing policies usually, but good to double check)
-- Existing policies on profiles typically allow reading by everyone and updating by self.
