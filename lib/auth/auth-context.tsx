'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogoutOverlay } from '@/components/ui/logout-overlay';

interface Profile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'DESIGNER';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  loggingOut: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loggingOut: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Auto-reset loggingOut cuando llegamos a /login (el "sensor del hotel")
  useEffect(() => {
    if (pathname === '/login' && loggingOut) {
      setLoggingOut(false);
    }
  }, [pathname, loggingOut]);

  // Función de logout que limpia estado inmediatamente
  const logout = async () => {
    setLoggingOut(true);
    // Limpiar estado inmediatamente para UI suave
    setUser(null);
    setProfile(null);
    
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      // NO ponemos loggingOut = false aquí
      // El overlay se mantiene hasta que la página cambie con router.push
    }
  };

  useEffect(() => {
    const supabase = createClient();

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

    // Cargar usuario - reutilizable para carga inicial y revalidación
    const loadUser = async (reason?: string) => {
      if (reason) {
        console.log(`[Auth] Revalidating session: ${reason}`);
      }
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error && !error.message.includes('Auth session missing')) {
          console.error('Supabase auth error:', error);
        }

        if (user) {
          setUser(user);
          await fetchProfile(supabase, user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // =========================================================
    // BFCache & Visibility Handlers
    // Detectan cuando la página se restaura desde caché del
    // navegador o cuando la tab vuelve a primer plano
    // =========================================================
    
    // Handler para BFCache: página restaurada desde back-forward cache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // La página fue restaurada desde BFCache
        // Las conexiones pueden estar stale, revalidar sesión
        loadUser('BFCache restore');
      }
    };

    // Handler para visibilidad: tab vuelve a primer plano
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // La tab volvió a estar visible, revalidar sesión
        // Esto maneja casos de tabs inactivas por mucho tiempo
        loadUser('Tab visible');
      }
    };

    // Safety timeout (producción: evitar pantalla en blanco indefinida)
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('[Auth] Loading timed out after 5s');
          return false;
        }
        return current;
      });
    }, 5000);

    // Registrar event listeners
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Carga inicial
    loadUser();

    // Escuchar cambios de autenticación de Supabase
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

    // Cleanup
    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loggingOut, logout }}>
      <LogoutOverlay isVisible={loggingOut} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
