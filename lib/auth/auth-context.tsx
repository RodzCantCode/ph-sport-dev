'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'DESIGNER' | 'USER';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Cargar usuario inicial
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error && !error.message.includes('Auth session missing')) {
          console.error('Supabase auth error:', error);
        }

        if (user) {
          setUser(user);
          await fetchProfile(supabase, user.id);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Función reutilizable para cargar perfil
    const fetchProfile = async (client: ReturnType<typeof createClient>, userId: string) => {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Profile fetch error:', error);
        return;
      }
      
      if (data) {
        setProfile(data as Profile);
      } else {
        // Usuario sin perfil: cerrar sesión y limpiar estado
        console.warn('User without profile detected. Signing out.');
        await client.auth.signOut();
        setUser(null);
        setProfile(null);
      }
    };

    // Safety timeout (producción: evitar pantalla en blanco indefinida)
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('Auth loading timed out');
          return false;
        }
        return current;
      });
    }, 5000);

    loadUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Solo actuar en eventos estables para evitar race conditions
      if (event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED' && event !== 'SIGNED_OUT') {
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(supabase, session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
