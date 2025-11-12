'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Design } from '@/lib/types/design';
import { mockUsers } from '@/lib/data/mock-data';
import RequireAuth from '@/components/auth/require-auth';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';

export default function DashboardPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadDashboard = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7); // rango más amplio para DEMO
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 21);

    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        console.log('Dashboard fetch result:', data);
        setItems(data.items || []);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
      loadDashboard(); // Recargar datos
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al repartir diseños');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <Loader className="p-6" />
      </RequireAuth>
    );
  }

  // Calcular KPIs
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Domingo

  // Diseños esta semana (por deadline_at)
  const designsThisWeek = items.filter((it) => {
    const deadline = new Date(it.deadline_at);
    return isWithinInterval(deadline, { start: weekStart, end: weekEnd });
  }).length;

  // En curso (IN_PROGRESS + TO_REVIEW) vs Entregados
  const inProgressCount = items.filter((it) => 
    it.status === 'IN_PROGRESS' || it.status === 'TO_REVIEW'
  ).length;
  const deliveredCount = items.filter((it) => it.status === 'DELIVERED').length;
  const totalWithProgress = inProgressCount + deliveredCount;
  const progressPercentage = totalWithProgress > 0 
    ? Math.round((deliveredCount / totalWithProgress) * 100)
    : 0;

  // Próximos a vencer (48h)
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const upcomingDeadlines = items.filter((it) => {
    const deadline = new Date(it.deadline_at);
    return deadline > now && deadline <= next48h && it.status !== 'DELIVERED';
  }).length;

  // Últimos 10 diseños ordenados por deadline ASC (más próximos primero)
  const recentDesigns = [...items]
    .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
    .slice(0, 10);

  const unassignedCount = items.filter((it) => !it.designer_id).length;

  return (
    <RequireAuth>
    <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Dashboard del Equipo
          </h1>
          <p className="text-gray-400">Vista general del equipo de diseño</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 animate-slide-up">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Diseño
        </Button>
        <Button variant="outline" asChild>
          <Link href="/my-week">
            <Calendar className="mr-2 h-4 w-4" />
            Ver Mi Semana
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard
          title="Diseños esta semana"
          value={designsThisWeek}
          description="Deadlines programados para esta semana"
          variant="primary"
        />
        <KpiCard
          title="% Entregados"
          value={`${progressPercentage}%`}
          description={`${deliveredCount} de ${totalWithProgress} en progreso/entregados`}
          variant={progressPercentage >= 50 ? 'success' : 'warning'}
          icon={TrendingUp}
        />
        <KpiCard
          title="Próximos a vencer"
          value={upcomingDeadlines}
          description="Diseños con deadline en próximas 48h"
          variant={upcomingDeadlines > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Lista compacta últimos 10 */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-orange-700">Últimos 10 Diseños</CardTitle>
          <CardDescription>Ordenados por deadline más próximo</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDesigns.length === 0 ? (
            <EmptyState
              title="No hay diseños"
              description="Crea tu primer diseño para comenzar"
              actionLabel="Crear Diseño"
              onAction={() => setDialogOpen(true)}
              className="border-0"
            />
          ) : (
            <div className="space-y-2">
              {recentDesigns.map((design) => {
                const designer = design.designer_id 
                  ? mockUsers.find((u) => u.id === design.designer_id)
                  : null;
                return (
                  <div
                    key={design.id}
                    className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/30 p-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-200 truncate">{design.title}</p>
                        <Badge status={design.status} className="shrink-0">
                          {design.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        {designer && (
                          <span>Asignado a: {designer.name}</span>
                        )}
                        <span>
                          {format(new Date(design.deadline_at), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repartir diseños (si hay sin asignar) */}
      {unassignedCount > 0 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-orange-700">Asignaciones Pendientes</CardTitle>
            <CardDescription>{unassignedCount} diseño{unassignedCount !== 1 ? 's' : ''} sin asignar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAssign} disabled={assigning}>
              <Users className="mr-2 h-4 w-4" />
              {assigning ? 'Repartiendo...' : 'Repartir Diseños'}
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateDesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDesignCreated={loadDashboard}
      />
    </div>
    </RequireAuth>
  );
}


