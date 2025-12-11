-- ========================================
-- MIGRATION 004: Notifications System
-- ========================================
-- Sistema de notificaciones con triggers automáticos
-- y tracking de mensajes leídos

-- ========================================
-- TABLA: notifications
-- ========================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('comment', 'assignment', 'deadline', 'system')),
  title text not null,
  message text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists notifications_user_unread_idx 
  on public.notifications(user_id, created_at desc) 
  where read = false;

create index if not exists notifications_user_all_idx 
  on public.notifications(user_id, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select 
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update 
  using (auth.uid() = user_id);

-- Permitir inserts desde triggers (security definer)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Realtime
alter publication supabase_realtime add table notifications;

-- ========================================
-- TABLA: message_read_status
-- ========================================
create table if not exists public.message_read_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  read_at timestamptz default now(),
  unique(user_id, comment_id)
);

-- Índice para consultas rápidas
create index if not exists message_read_status_user_idx 
  on public.message_read_status(user_id);

-- RLS
alter table public.message_read_status enable row level security;

create policy "Users manage own read status"
  on public.message_read_status for all 
  using (auth.uid() = user_id);

-- ========================================
-- FUNCIÓN: Limpiar notificaciones antiguas
-- ========================================
create or replace function public.cleanup_old_notifications()
returns trigger as $$
begin
  -- Eliminar notificaciones leídas mayores a 30 días
  delete from public.notifications 
  where created_at < now() - interval '30 days' and read = true;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que se ejecuta al insertar nuevas notificaciones
drop trigger if exists trigger_cleanup_notifications on public.notifications;
create trigger trigger_cleanup_notifications
  after insert on public.notifications
  for each statement execute function public.cleanup_old_notifications();

-- ========================================
-- FUNCIÓN: Notificar al recibir comentario
-- ========================================
create or replace function public.notify_on_comment()
returns trigger as $$
declare
  design_owner_id uuid;
  commenter_name text;
  design_title text;
begin
  -- Obtener el diseñador asignado y título del diseño
  select designer_id, title into design_owner_id, design_title
  from public.designs where id = new.design_id;
  
  -- Obtener nombre del que comenta
  select full_name into commenter_name
  from public.profiles where id = new.user_id;
  
  -- No notificar si el comentario es del propio diseñador asignado
  if design_owner_id is not null and design_owner_id != new.user_id then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      design_owner_id,
      'comment',
      'Nuevo comentario',
      coalesce(commenter_name, 'Alguien') || ' comentó en "' || coalesce(design_title, 'un diseño') || '"',
      '/designs/' || new.design_id
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_notify_on_comment on public.comments;
create trigger trigger_notify_on_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ========================================
-- FUNCIÓN: Notificar al asignar diseño
-- ========================================
create or replace function public.notify_on_assignment()
returns trigger as $$
begin
  -- Solo notificar si se asigna a alguien nuevo
  if new.designer_id is not null and 
     (old.designer_id is null or old.designer_id != new.designer_id) then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      new.designer_id,
      'assignment',
      'Nueva asignación',
      'Te han asignado el diseño "' || coalesce(new.title, 'Sin título') || '"',
      '/designs/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_notify_on_assignment on public.designs;
create trigger trigger_notify_on_assignment
  after update on public.designs
  for each row execute function public.notify_on_assignment();

-- ========================================
-- ✅ MIGRACIÓN 004 COMPLETADA
-- ========================================
