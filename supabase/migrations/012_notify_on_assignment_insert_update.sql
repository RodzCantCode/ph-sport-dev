-- Notify on assignment for inserts and updates

drop trigger if exists trigger_notify_on_assignment on public.designs;
create trigger trigger_notify_on_assignment
  after insert or update on public.designs
  for each row execute function public.notify_on_assignment();
