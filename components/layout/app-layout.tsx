'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { SidebarSkeleton } from '@/components/skeletons/sidebar-skeleton';
import { useAuth } from '@/lib/auth/auth-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Consumimos el nuevo estado robusto
  const { status } = useAuth();
  const router = useRouter();

  // Derived state: Are we fully ready?
  // Only show UI when strictly AUTHENTICATED
  const authReady = status === 'AUTHENTICATED';

  // Guard Effect: Enforce Login if we are definitely NOT authenticated
  useEffect(() => {
    // Si la inicialización terminó y el resultado fue "UNAUTHENTICATED",
    // nos vamos al login. Sin dudas.
    if (status === 'UNAUTHENTICATED') {
      router.push('/login');
    }
  }, [status, router]);

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - show skeleton while Initializing */}
      {authReady ? (
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      ) : (
        <SidebarSkeleton collapsed={sidebarCollapsed} />
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && authReady && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in"
            onClick={toggleMobileMenu}
          />
          <div className="fixed left-0 top-0 z-40 md:hidden">
            <Sidebar collapsed={false} onToggle={toggleMobileMenu} onClose={toggleMobileMenu} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out',
          !sidebarCollapsed ? 'md:ml-64' : 'md:ml-20'
        )}
      >
        <Header onMenuClick={toggleMobileMenu} />
        {/* Renderizamos el contenido, pero podríamos bloquearlo también si authReady es false */}
        {/* Por ahora lo dejamos visible para mejorar la percepción de carga (Skeleton UI) */}
        <main className="flex-1 overflow-y-auto animate-page-enter">{children}</main>
      </div>
    </div>
  );
}
