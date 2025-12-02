'use client';

import { shouldUseMockData } from '@/lib/demo-mode';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'designer' | 'manager' | 'admin';
}

/**
 * Obtiene el usuario actual autenticado (solo cliente)
 * 
 * IMPORTANTE: Esta función solo funciona en el cliente (useEffect, event handlers).
 * No llamar durante el render inicial del servidor.
 * 
 * TODO: Cuando migres a Supabase, reemplazar esta función:
 * - Usar supabase.auth.getUser() para obtener el usuario
 * - Query a profiles para obtener el rol
 * - Devolver el mismo formato CurrentUser
 * 
 * @returns Usuario actual o null si no hay sesión
 */
export function getCurrentUser(): CurrentUser | null {
  // Solo funciona en el cliente
  if (typeof window === 'undefined') return null;
  
  // DEMO MODE: leer desde sessionStorage
  if (shouldUseMockData()) {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as CurrentUser;
    } catch {
      return null;
    }
  }

  // Modo real: requiere usar getCurrentUserAsync()
  return null;
}

/**
 * Obtiene el usuario actual autenticado (versión asíncrona)
 * 
 * Esta versión soporta tanto modo demo como Supabase.
 * Usar esta función en lugar de getCurrentUser() para nuevos componentes.
 * 
 * @returns Usuario actual o null si no hay sesión
 */
export async function getCurrentUserAsync(): Promise<CurrentUser | null> {
  // DEMO MODE: usar función síncrona existente
  if (shouldUseMockData()) {
    return getCurrentUser();
  }

  // MODO REAL: consultar Supabase
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

