import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getUser();
  if (!user?.user_metadata?.role) {
    return null;
  }
  return user.user_metadata.role as UserRole;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const role = session.user?.user_metadata?.role as UserRole;
  
  if (!allowedRoles.includes(role)) {
    redirect('/');
  }
  
  return { session, role };
}


