'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (!userStr) {
      router.replace('/login');
      return;
    }

    setReady(true);
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
