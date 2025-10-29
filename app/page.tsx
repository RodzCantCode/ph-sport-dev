'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay usuario en sessionStorage (DEMO mode)
    if (isDemoMode()) {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Redirigir según rol
          if (user.role === 'manager' || user.role === 'admin') {
            router.replace('/dashboard');
          } else {
            router.replace('/my-week');
          }
          return;
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
    }
    
    // Sin sesión, redirigir a login
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">PH Sport Dashboard</h1>
        <p>Cargando...</p>
      </div>
    </div>
  );
}