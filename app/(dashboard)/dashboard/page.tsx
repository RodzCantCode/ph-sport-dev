'use client';

import { useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { toast } from 'sonner';
import { Home } from 'lucide-react';
import { CreateDesignButton } from '@/components/features/designs/dialogs/create-design-button';
import { useAuth } from '@/lib/auth/auth-context';
import { DesignerDashboard } from '@/components/features/dashboard/designer-dashboard';
import { AdminDashboard } from '@/components/features/dashboard/admin-dashboard';
import { useDashboard } from '@/lib/hooks/use-dashboard';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { items, isLoading, mutate } = useDashboard();
  const [assigning, setAssigning] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dateRangeLabel = `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM', { locale: es })}`;

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const response = await fetch('/api/designs/assign', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al repartir diseños');
      }

      const result = await response.json();
      toast.success(result.message || 'Diseños repartidos exitosamente');
      mutate(); // Revalidate SWR cache
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al repartir diseños');
    } finally {
      setAssigning(false);
    }
  };

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = isLoading && items.length === 0;

  return (
    <PageTransition loading={showSkeleton} skeleton={<DashboardSkeleton />}>
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Home className="h-8 w-8 text-primary" />
              Inicio
            </h1>
            <p className="text-muted-foreground">
              Semana del {dateRangeLabel}
            </p>
          </div>

          {profile?.role === 'ADMIN' && (
            <CreateDesignButton onDesignCreated={() => mutate()} size="lg" />
          )}
        </div>

        {/* Dashboard específico por rol */}
        {profile?.role === 'ADMIN' ? (
          <AdminDashboard items={items} onAssign={handleAssign} assigning={assigning} />
        ) : user ? (
          <DesignerDashboard items={items} userId={user.id} />
        ) : null}
      </div>
    </PageTransition>
  );
}
