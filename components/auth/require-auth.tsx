'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { config } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // No proteger la página de login
    if (pathname && pathname.startsWith('/login')) {
      setReady(true);
      return;
    }

    const checkAuth = async () => {
      // 1. MODO DEMO: Verificar sessionStorage
      if (config.demoMode) {
        const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
        if (!userStr) {
          router.replace('/login');
          return;
        }
        setReady(true);
        return;
      }

      // 2. MODO REAL: Verificar Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      setReady(true);
    };

    checkAuth();
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
