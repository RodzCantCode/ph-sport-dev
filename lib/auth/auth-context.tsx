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
    
    // Flag para evitar revalidaciones durante la carga inicial
    let initialLoadComplete = false;

    // Función reutilizable para cargar perfil con reintentos
    const fetchProfile = async (client: ReturnType<typeof createClient>, userId: string, retries = 3) => {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data as Profile);
        } else {
          // Usuario existe en Auth pero no tiene perfil -> Error crítico de datos
          throw new Error('User missing profile data');
        }
      } catch (err) {
        console.warn(`[Auth] Profile fetch error (attempts left: ${retries}):`, err);
        
        if (retries > 0) {
          // Esperar un poco antes de reintentar (backoff exponencial simple: 500ms, 1000ms, 1500ms...)
          const delay = (4 - retries) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchProfile(client, userId, retries - 1);
        } else {
          // Fallo definitivo tras reintentos
          console.error('[Auth] Critical: Failed to load profile after retries. Enforcing cleanup.');
          
          // Limpiar todo y forzar logout para evitar estado zombie
          await client.auth.signOut();
          setUser(null);
          setProfile(null);
          // Opcional: Podríamos redirigir a login con error, pero el effect de ruta lo manejará
        }
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
        console.log(`[Auth] loadUser complete. User found? ${!!user}. Loading set to false.`);
        setLoading(false);
        initialLoadComplete = true;
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
        console.log('[Auth] Page restored from BFCache, revalidating...');
        loadUser('BFCache restore');
      }
    };

    // Handler para visibilidad: tab vuelve a primer plano
    const handleVisibilityChange = () => {
      // Solo revalidar si la carga inicial ya completó
      // Esto evita race conditions durante el montaje inicial
      if (initialLoadComplete && document.visibilityState === 'visible') {
        console.log('[Auth] Tab visible, revalidating session...');
        loadUser('Tab visible');
      }
    };

    // Safety timeout (producción: evitar pantalla en blanco indefinida)
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('[Auth] Loading timed out after 8s');
          return false;
        }
        return current;
      });
    }, 8000);

    // Registrar event listeners
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Carga inicial
    loadUser();

    // Escuchar cambios de autenticación de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignoramos INITIAL_SESSION porque ya hacemos una carga manual explícita con loadUser()
      // Esto evita la doble llamada (race condition) al montar el componente.
      if (event === 'INITIAL_SESSION') {
        return;
      }

      // Manejar eventos relevantes de cambio de sesión
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (session?.user) {
          // Si es un refresco o login, actualizamos estado
          setUser(session.user);
          
          // Optimización: Solo cargar perfil en SIGNED_IN o USER_UPDATED
          // En TOKEN_REFRESHED solo actualizamos la sesión (token) pero el perfil no cambia
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
             await fetchProfile(supabase, session.user.id);
          }
        } else {
          // Logout o sesión inválida
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loggingOut, logout }}>
      <LogoutOverlay isVisible={loggingOut} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
