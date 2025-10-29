'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { DesignStatus } from '@/lib/types/filters';

interface DesignItem {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  folder_url?: string;
  status: DesignStatus;
  designer_id?: string;
  deadline_at: string;
}

const statusFlow: Record<DesignStatus, DesignStatus[]> = {
  BACKLOG: ['IN_PROGRESS'],
  IN_PROGRESS: ['TO_REVIEW'],
  TO_REVIEW: [],
  DELIVERED: [],
};

export default function MyWeekPage() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [designerId, setDesignerId] = useState<string | undefined>(undefined);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadTasks = () => {
    const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    const user = userStr ? JSON.parse(userStr) : null;
    setDesignerId(user?.id);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 21);

    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      designerId: user?.id || '',
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

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
      loadTasks();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const filteredItems = items.filter((it) => !designerId || it.designer_id === designerId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Semana</h1>
        <p className="text-muted-foreground">Tus tareas asignadas</p>
      </div>

      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">No tienes tareas asignadas</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((task) => {
            const nextStatuses = statusFlow[task.status];
            return (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>
                    {task.player} - {task.match_home} vs {task.match_away}
                  </CardDescription>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Deadline: {format(new Date(task.deadline_at), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
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
                        {task.status}
                      </Badge>
                      {task.folder_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={task.folder_url} target="_blank" rel="noopener noreferrer">
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
    </div>
  );
}


