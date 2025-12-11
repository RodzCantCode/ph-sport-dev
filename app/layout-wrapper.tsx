'use client';
 
import { AppLayout } from '@/components/layout/app-layout';
import { usePathname } from 'next/navigation';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AppLayout>{children}</AppLayout>
  );
}

