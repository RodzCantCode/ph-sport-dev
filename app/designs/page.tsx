'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ExternalLink } from 'lucide-react';
import { CreateDesignDialog } from '@/components/dialogs/create-design-dialog';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { mockUsers } from '@/lib/mock-data';
import type { Design } from '@/lib/types/design';

export default function DesignsPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadDesigns = () => {
    setLoading(true);
    setError(null);
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
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar diseños');
        return r.json();
      })
      .then((data) => setItems(data.items || []))
      .catch((err) => {
        console.error('Designs fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  if (loading) return <Loader className="p-6" />;
  
  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error al cargar diseños"
          description={error}
          actionLabel="Reintentar"
          onAction={loadDesigns}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
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
          <EmptyState
            title="No hay diseños programados"
            description="Crea tu primer diseño para comenzar"
            actionLabel="Crear Diseño"
            onAction={() => setDialogOpen(true)}
          />
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
                  <Badge status={design.status}>
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


