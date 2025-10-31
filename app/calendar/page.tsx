'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { getCurrentUser, isAdminOrManager } from '@/lib/auth/get-current-user';
import { mockUsers } from '@/lib/mock-data';
import type { Design } from '@/lib/types/design';
import { STATUS_COLORS } from '@/lib/types/design';
import RequireAuth from '@/components/auth/require-auth';

// Dynamic import para evitar problemas con SSR
const DesignCalendar = dynamic(
  () => import('@/components/calendar/design-calendar'),
  {
    ssr: false,
    loading: () => <Loader variant="spinner" message="Cargando calendario..." />,
  }
);

export default function CalendarPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Design | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser> | null>(null);

  const loadTasks = () => {
    setLoading(true);
    setError(null);
    
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 21);

    // Si es admin/manager, NO enviar designerId (ver todas las tareas)
    // Si es designer, enviar designerId (ver solo sus tareas)
    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      ...(currentUser && !isAdminOrManager(currentUser) && currentUser.id
        ? { designerId: currentUser.id }
        : {}),
    });

    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar diseños');
        return r.json();
      })
      .then((data) => setItems(data.items || []))
      .catch((err) => {
        console.error('Calendar fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleEventClick = (task: Design) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="p-6">
          <Loader variant="spinner" message="Cargando calendario..." />
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="p-6">
          <ErrorState message={error} onRetry={loadTasks} />
        </div>
      </RequireAuth>
    );
  }

  // Filtrar items según rol del usuario
  const filteredItems = isAdminOrManager(user)
    ? items
    : items.filter((it) => it.designer_id === user?.id);

  return (
    <RequireAuth>
      <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
              Calendario
            </h1>
            <p className="text-gray-400">
              {isAdminOrManager(user)
                ? 'Vista del equipo completo'
                : 'Tus tareas asignadas'}
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title="No hay diseños programados"
            description={
              isAdminOrManager(user)
                ? 'No hay diseños en el calendario para el período seleccionado'
                : 'No tienes diseños asignados en este período'
            }
            actionLabel="Ver diseños"
            actionHref="/designs"
          />
        ) : (
          typeof window !== 'undefined' ? (
            <div className="animate-slide-up">
              <DesignCalendar
                items={filteredItems}
                onEventClick={handleEventClick}
              />
            </div>
          ) : (
            <Loader variant="spinner" message="Cargando calendario..." />
          )
        )}

        {/* Dialog para detalles del evento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedTask && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedTask.title}</DialogTitle>
                  <DialogDescription>
                    {selectedTask.player} - {selectedTask.match_home} vs {selectedTask.match_away}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={STATUS_COLORS[selectedTask.status].badgeVariant}
                    >
                      {selectedTask.status}
                    </Badge>
                    {selectedTask.designer_id && (
                      <Badge variant="secondary">
                        {mockUsers.find((u) => u.id === selectedTask.designer_id)?.name || 'Desconocido'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>
                      <strong className="text-gray-300">Deadline:</strong>{' '}
                      {format(new Date(selectedTask.deadline_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  {selectedTask.folder_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={selectedTask.folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir carpeta Drive
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}

