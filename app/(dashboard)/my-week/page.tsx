'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ExternalLink, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import type { DesignStatus } from '@/lib/types/filters';
import { STATUS_FLOW, STATUS_LABELS } from '@/lib/types/design';
import { getDefaultWeekRange } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import type { Design } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

// Dynamic import para evitar problemas con SSR
// Importación explícita del default export
const DesignCalendar = dynamic(
  () => import('@/components/features/designs/calendar/design-calendar'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 text-muted-foreground bg-muted rounded-xl">
        Cargando calendario...
      </div>
    ),
  }
);

export default function MyWeekPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedTask, setSelectedTask] = useState<Design | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Paginación (solo para vista lista)
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadTasks = async () => {
      // Si está cargando auth, esperar
      if (authLoading) return;

      // Si no hay user, no cargar nada (middleware redirigirá si es necesario, pero aquí solo paramos)
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { weekStart, weekEnd } = getDefaultWeekRange();

      // Si es admin/manager, NO enviar designerId (ver todas las tareas)
      // Si es designer, enviar designerId (ver solo sus tareas)
      const qs = new URLSearchParams({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        // Solo añadir designerId si es designer (no admin/manager)
        ...(profile.role === 'DESIGNER' ? { designerId: user.id } : {}),
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

  const handleStatusChange = async (id: string, newStatus: DesignStatus) => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/designs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado');
      // Actualizar estado localmente
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };


  // Filtrar items según rol del usuario
  // Admins/Managers ven todas las tareas, Designers solo las suyas
  const filteredItems = (profile?.role === 'ADMIN')
    ? items  // Admins/Managers ven todas las tareas del equipo
    : items.filter((it) => it.designer_id === user?.id);  // Designers solo sus tareas asignadas

  // Paginar items (solo para vista lista)
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <PageTransition loading={loading} skeleton={<MyWeekSkeleton />}>
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Mi Semana
          </h1>
          <p className="text-muted-foreground">Gestiona tus tareas y entregas</p>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-muted p-1">
          <Button
            type="button"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="min-w-[100px]"
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            type="button"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="min-w-[100px]"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendario
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Controles de paginación arriba */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems} tarea{totalItems !== 1 ? 's' : ''} en total
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400">Mostrar</Label>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    {(profile?.role === 'ADMIN')
                      ? 'No hay tareas asignadas en el equipo' 
                      : 'No tienes tareas asignadas'}
                  </p>
                  {(profile?.role !== 'ADMIN') && (
                    <Button asChild>
                      <Link href="/designs">Ver backlog</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            paginatedItems.map((task) => {
            const nextStatuses = STATUS_FLOW[task.status];
            return (
              <Card 
                key={task.id}
              >
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <span>{task.player}</span>
                    {task.player_status && <PlayerStatusTag status={task.player_status} />}
                    <span>- {task.match_home} vs {task.match_away}</span>
                  </CardDescription>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Fecha de entrega: {format(new Date(task.deadline_at), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.status === 'TO_REVIEW'
                            ? 'default'
                            : task.status === 'IN_PROGRESS'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {STATUS_LABELS[task.status]}
                      </Badge>
                      {task.folder_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={task.folder_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir carpeta Drive">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-2">
                        {nextStatuses.map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(task.id, nextStatus)}
                            disabled={updating === task.id}
                          >
                            {updating === task.id
                              ? 'Actualizando...'
                              : nextStatus === 'IN_PROGRESS'
                                ? 'Comenzar'
                                : nextStatus === 'TO_REVIEW'
                                  ? 'Marcar para Revisión'
                                  : nextStatus}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

          {/* Controles de paginación abajo */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-slide-up">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    {(profile?.role === 'ADMIN')
                      ? 'No hay tareas asignadas en el equipo' 
                      : 'No tienes tareas asignadas'}
                  </p>
                  {(profile?.role !== 'ADMIN') && (
                    <Button asChild>
                      <Link href="/designs">Ver backlog</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            typeof window !== 'undefined' ? (
              <DesignCalendar
                items={filteredItems}
                onEventClick={(task) => {
                  setSelectedTask(task);
                  setDialogOpen(true);
                }}
              />
            ) : (
              <Card>
                <CardContent className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Cargando calendario...</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Dialog para detalles del evento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask && (
                <>
                  {selectedTask.player} - {selectedTask.match_home} vs {selectedTask.match_away}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Fecha de entrega: {format(new Date(selectedTask.deadline_at), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedTask.status === 'TO_REVIEW'
                      ? 'default'
                      : selectedTask.status === 'IN_PROGRESS'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {STATUS_LABELS[selectedTask.status]}
                </Badge>
                {selectedTask.folder_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={selectedTask.folder_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Carpeta Drive
                    </a>
                  </Button>
                )}
              </div>

              {STATUS_FLOW[selectedTask.status].length > 0 && (
                <div className="flex gap-2 pt-2">
                  {STATUS_FLOW[selectedTask.status].map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleStatusChange(selectedTask.id, nextStatus);
                        setDialogOpen(false);
                      }}
                      disabled={updating === selectedTask.id}
                      className="flex-1"
                    >
                      {updating === selectedTask.id
                        ? 'Actualizando...'
                        : nextStatus === 'IN_PROGRESS'
                          ? 'Comenzar'
                          : nextStatus === 'TO_REVIEW'
                            ? 'Marcar para Revisión'
                            : nextStatus}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
}


