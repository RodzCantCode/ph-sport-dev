'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ExternalLink } from 'lucide-react';
import { CreateDesignDialog } from '@/components/dialogs/create-design-dialog';
import { mockUsers } from '@/lib/mock-data';
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

export default function DesignsPage() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadDesigns = () => {
    setLoading(true);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 21);

    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Diseños
          </h1>
          <p className="text-gray-400">Gestión de todas las piezas gráficas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="animate-slide-up">
          <Plus className="mr-2 h-4 w-4" />
          Crear Diseño
        </Button>
      </div>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-gray-400">No hay diseños programados</p>
            </CardContent>
          </Card>
        ) : (
          items.map((design, index) => (
            <Card 
              key={design.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{design.title}</CardTitle>
                    <CardDescription className="text-base">
                      {design.player} - {design.match_home} vs {design.match_away}
                    </CardDescription>
                  </div>
                  {design.folder_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={design.folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Carpeta Drive
                      </a>
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  Deadline: {format(new Date(design.deadline_at), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      design.status === 'TO_REVIEW'
                        ? 'default'
                        : design.status === 'IN_PROGRESS'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {design.status}
                  </Badge>
                  {design.designer_id && (
                    <Badge variant="secondary">
                      Asignado a: {mockUsers.find((u) => u.id === design.designer_id)?.name || 'Desconocido'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateDesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDesignCreated={loadDesigns}
      />
    </div>
  );
}


