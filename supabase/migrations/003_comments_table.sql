-- Create comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  design_id uuid references designs(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table comments enable row level security;

-- Policies

-- Select: All authenticated users can read comments
create policy "Users can view all comments"
  on comments for select
  using ( auth.role() = 'authenticated' );

-- Insert: Authenticated users can insert their own comments
create policy "Users can insert their own comments"
  on comments for insert
  with check ( auth.uid() = user_id );

-- Delete: Users can delete their own comments, Admins can delete any
create policy "Users can delete own comments or admins can delete any"
  on comments for delete
  using ( 
    auth.uid() = user_id 
    or 
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'ADMIN'
    )
  );

-- Realtime subscription
alter publication supabase_realtime add table comments;
