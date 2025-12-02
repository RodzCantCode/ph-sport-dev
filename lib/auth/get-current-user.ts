'use client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'designer' | 'manager' | 'admin';
}

/**
 * Obtiene el usuario actual autenticado
 * 
 * @returns Usuario actual o null si no hay sesión
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Solo en cliente
  if (typeof window === 'undefined') return null;

  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  
  // Obtener perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) return null;
  
  // Mapear role de Supabase a formato de la app
  const role = profile.role === 'ADMIN' ? 'admin' : 'designer';
  
  return {
    id: user.id,
    email: user.email || '',
    name: profile.full_name || user.email?.split('@')[0] || '',
    role: role as 'designer' | 'manager' | 'admin',
  };
}

/**
 * Helper para verificar si el usuario es admin o manager
 * Los admins y managers pueden ver todas las tareas del equipo
 */
export function isAdminOrManager(user: CurrentUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
}

