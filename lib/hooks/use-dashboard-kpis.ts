import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Design } from '@/lib/types/design';

interface DashboardKPIs {
  designsThisWeek: number;
  progressPercentage: number;
  deliveredCount: number;
  totalWithProgress: number;
  upcomingDeadlines: number;
}

/**
 * Hook para calcular KPIs del dashboard
 * Separa la lógica de cálculo de la presentación
 */
export function useDashboardKPIs(items: Design[]): DashboardKPIs {
  return useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Domingo

    // Diseños esta semana (por deadline_at)
    const designsThisWeek = items.filter((it) => {
      const deadline = new Date(it.deadline_at);
      return isWithinInterval(deadline, { start: weekStart, end: weekEnd });
    }).length;

    // En curso (IN_PROGRESS + TO_REVIEW) vs Entregados
    const inProgressCount = items.filter(
      (it) => it.status === 'IN_PROGRESS' || it.status === 'TO_REVIEW'
    ).length;
    const deliveredCount = items.filter((it) => it.status === 'DELIVERED').length;
    const totalWithProgress = inProgressCount + deliveredCount;
    const progressPercentage =
      totalWithProgress > 0 ? Math.round((deliveredCount / totalWithProgress) * 100) : 0;

    // Próximos a vencer (48h)
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const upcomingDeadlines = items.filter((it) => {
      const deadline = new Date(it.deadline_at);
      return deadline > now && deadline <= next48h && it.status !== 'DELIVERED';
    }).length;

    return {
      designsThisWeek,
      progressPercentage,
      deliveredCount,
      totalWithProgress,
      upcomingDeadlines,
    };
  }, [items]);
}







