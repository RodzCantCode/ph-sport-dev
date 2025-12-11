'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Calendar, TrendingUp, ChevronRight, Palette, Activity } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { logger } from '@/lib/utils/logger';
import { useDashboardKPIs } from '@/lib/hooks/use-dashboard-kpis';
import { STATUS_LABELS } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

export default function DashboardPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { designers } = useDesigners();

  const loadDashboard = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        logger.log('Dashboard fetch result:', data);
        setItems(data.items || []);
      })
      .catch((err) => {
        logger.error('Dashboard fetch error:', err);
        toast.error('Error al cargar los datos. Por favor, intenta de nuevo.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dateRangeLabel = `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM', { locale: es })}`;

  // Calcular KPIs usando hook personalizado - DEBE estar antes de cualquier return condicional
  const { designsThisWeek, progressPercentage, deliveredCount, totalWithProgress, upcomingDeadlines } = useDashboardKPIs(items);

  // Últimos 5 diseños ordenados por deadline ASC (más próximos primero)
  const recentDesigns = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, 5);
  }, [items]);

  // Memoizar cálculos de tiempo restante para cada diseño
  type DesignWithCalculations = Design & {
    hoursUntilDeadline: number;
    isUrgent: boolean;
    isCritical: boolean;
  };

  const recentDesignsWithCalculations = useMemo<DesignWithCalculations[]>(() => {
    const now = new Date();
    return recentDesigns.map((design) => {
      const deadline = new Date(design.deadline_at);
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return {
        ...design,
        hoursUntilDeadline,
        isUrgent: hoursUntilDeadline < 48 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED',
        isCritical: hoursUntilDeadline < 24 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED',
      };
    });
  }, [recentDesigns]);

  const unassignedCount = items.filter((it) => !it.designer_id).length;

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
    return <Loader className="p-6" />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header simplificado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inicio
          </h1>
          <p className="text-muted-foreground">
            Semana del {dateRangeLabel}
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Crear Diseño
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Diseños esta semana"
          value={designsThisWeek}
          description="Entregas programadas"
          variant="primary"
        />
        <KpiCard
          title="% Entregados"
          value={`${progressPercentage}%`}
          description={`${deliveredCount} de ${totalWithProgress}`}
          variant={progressPercentage >= 50 ? 'success' : 'warning'}
          icon={TrendingUp}
        />
        <KpiCard
          title="Próximos a vencer"
          value={upcomingDeadlines}
          description="En próximas 48h"
          variant={upcomingDeadlines > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/my-week" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">Mi Semana</p>
                <p className="text-sm text-muted-foreground">Calendario personal</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/designs" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">Ver Diseños</p>
                <p className="text-sm text-muted-foreground">Lista completa</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/communications" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">Actividad</p>
                <p className="text-sm text-muted-foreground">Feed del equipo</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Próximas Entregas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximas Entregas</CardTitle>
            <CardDescription>Diseños con deadline más cercano</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/designs">Ver todos</Link>
          </Button>
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
            <div className="divide-y divide-border">
              {recentDesignsWithCalculations.map((design) => {
                const designer = designers.find(d => d.id === design.designer_id);
                
                return (
                  <Link
                    key={design.id}
                    href={`/designs/${design.id}`}
                    className="flex items-center justify-between rounded-lg p-4 hover:bg-accent/50 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{design.title}</p>
                        <Badge status={design.status} className="shrink-0">
                          {STATUS_LABELS[design.status]}
                        </Badge>
                        {design.player_status && (
                          <PlayerStatusTag status={design.player_status} />
                        )}
                        {design.isCritical && (
                          <Badge variant="destructive" className="animate-pulse shrink-0">
                            🔥 {Math.floor(design.hoursUntilDeadline)}h
                          </Badge>
                        )}
                        {design.isUrgent && !design.isCritical && (
                          <Badge className="bg-yellow-500/30 text-yellow-400 border-yellow-500/50 shrink-0">
                            ⚠️ Urgente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {designer && (
                          <span>Asignado a: {designer.name}</span>
                        )}
                        <span>
                          {format(new Date(design.deadline_at), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 shrink-0" />
                  </Link>
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
            <CardTitle className="text-primary">Asignaciones Pendientes</CardTitle>
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
  );
}
