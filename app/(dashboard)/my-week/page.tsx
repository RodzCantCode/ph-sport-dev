'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ExternalLink, AlertTriangle, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import type { DesignStatus } from '@/lib/types/filters';
import { STATUS_LABELS } from '@/lib/types/design';
import { getDefaultWeekRange } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import type { Design } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';

const STATUS_ORDER: Record<DesignStatus, number> = {
  BACKLOG: 0,
  IN_PROGRESS: 1,
  TO_REVIEW: 2,
  DELIVERED: 3,
};

export default function MyWeekPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  
  // Estado para panel de detalles
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Redireccionar admins a /team
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'ADMIN') {
      router.replace('/team');
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    const loadTasks = async () => {
      if (authLoading) return;
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { weekStart, weekEnd } = getDefaultWeekRange();

      const qs = new URLSearchParams({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        designerId: user.id,
      });
      
      try {
        const r = await fetch(`/api/designs?${qs.toString()}`);
        if (!r.ok) throw new Error('Error al cargar las tareas');
        const data = await r.json();
        setItems(data.items || []);
      } catch (err) {
        logger.error('My week fetch error:', err);
        toast.error('Error al cargar las tareas. Por favor, intenta de nuevo.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user, profile, authLoading]);

  const handleStatusChange = async (design: Design, newStatus: DesignStatus) => {
    // Confirmar si es un cambio regresivo
    const isRegressive = STATUS_ORDER[newStatus] < STATUS_ORDER[design.status];
    
    if (isRegressive) {
      const confirmed = await confirm({
        title: '¿Volver atrás?',
        description: `¿Estás seguro de cambiar "${design.title}" de ${STATUS_LABELS[design.status]} a ${STATUS_LABELS[newStatus]}?`,
        confirmText: 'Sí, cambiar',
        cancelText: 'Cancelar',
      });
      
      if (!confirmed) return;
    }

    setUpdating(design.id);
    try {
      const response = await fetch(`/api/designs/${design.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado');
      setItems(prev => prev.map(item => 
        item.id === design.id ? { ...item, status: newStatus } : item
      ));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  // Ordenar por deadline (próximo primero), completados al final
  const sortedItems = [...items].sort((a, b) => {
    // Completados al final
    if (a.status === 'DELIVERED' && b.status !== 'DELIVERED') return 1;
    if (b.status === 'DELIVERED' && a.status !== 'DELIVERED') return -1;
    
    // Por deadline
    return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
  });

  const getUrgencyBadge = (design: Design) => {
    if (design.status === 'DELIVERED') return null;
    
    const now = new Date();
    const deadline = new Date(design.deadline_at);
    const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 0) {
      return <Badge variant="destructive" className="shrink-0">Atrasado</Badge>;
    } else if (hoursUntil < 24) {
      return (
        <Badge variant="destructive" className="shrink-0 gap-1">
          <Flame className="h-3 w-3" />
          {Math.floor(hoursUntil)}h
        </Badge>
      );
    } else if (hoursUntil < 48) {
      return (
        <Badge className="bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 border-yellow-500/50 shrink-0 gap-1">
          <AlertTriangle className="h-3 w-3" />
          {Math.floor(hoursUntil)}h
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <PageTransition loading={loading || authLoading} skeleton={<MyWeekSkeleton />}>
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Mi Semana
            </h1>
            <p className="text-muted-foreground">Gestiona tus tareas y entregas</p>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  No tienes tareas asignadas
                </p>
                <Button asChild>
                  <Link href="/designs">Ver backlog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((design) => {
              const urgencyBadge = getUrgencyBadge(design);
              const isCompleted = design.status === 'DELIVERED';
              
              return (
                <Card 
                  key={design.id}
                  className={isCompleted ? 'opacity-60' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Título y contexto */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedDesignId(design.id);
                              setDetailSheetOpen(true);
                            }}
                            className="font-medium hover:text-primary transition-colors text-left"
                          >
                            {design.title}
                          </button>
                          {design.player_status && (
                            <PlayerStatusTag status={design.player_status} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {design.player} · {design.match_home} vs {design.match_away}
                        </p>
                      </div>

                      {/* Fecha */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(design.deadline_at), "dd MMM HH:mm", { locale: es })}
                      </div>

                      {/* Urgencia */}
                      {urgencyBadge}

                      {/* Estado */}
                      <Select
                        value={design.status}
                        onValueChange={(value) => handleStatusChange(design, value as DesignStatus)}
                        disabled={updating === design.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BACKLOG">{STATUS_LABELS.BACKLOG}</SelectItem>
                          <SelectItem value="IN_PROGRESS">{STATUS_LABELS.IN_PROGRESS}</SelectItem>
                          <SelectItem value="TO_REVIEW">{STATUS_LABELS.TO_REVIEW}</SelectItem>
                          <SelectItem value="DELIVERED">{STATUS_LABELS.DELIVERED}</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Drive */}
                      {design.folder_url && (
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                          <a href={design.folder_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir carpeta Drive">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm dialog for regressive status changes */}
      {options && (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={handleCancel}
          onConfirm={handleConfirm}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmText || 'Confirmar'}
          cancelLabel={options.cancelText || 'Cancelar'}
          variant={options.variant || 'warning'}
        />
      )}
    </PageTransition>
  );
}
