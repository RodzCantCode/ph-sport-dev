'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, Edit2, ExternalLink, Calendar, User } from 'lucide-react';
import { mockUsers } from '@/lib/data/mock-data';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import type { DesignHistoryItem } from '@/lib/types/design';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

// Historial simulado para demo
function generateHistory(design: Design): DesignHistoryItem[] {
  const history: DesignHistoryItem[] = [];
  const now = new Date();

  // Creación
  if (design.created_at) {
    history.push({
      id: `h-${design.id}-1`,
      design_id: design.id,
      action: 'created',
      actor_id: design.created_by,
      actor_name: mockUsers.find(u => u.id === design.created_by)?.name || 'Sistema',
      payload: { title: design.title },
      created_at: design.created_at,
    });
  } else {
    // Si no hay created_at, simulamos
    history.push({
      id: `h-${design.id}-1`,
      design_id: design.id,
      action: 'created',
      actor_id: 'system',
      actor_name: 'Sistema',
      payload: { title: design.title },
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Asignación
  if (design.designer_id) {
    const designer = mockUsers.find(u => u.id === design.designer_id);
    history.push({
      id: `h-${design.id}-2`,
      design_id: design.id,
      action: 'assigned',
      actor_id: 'system',
      actor_name: 'Sistema',
      payload: { designer_id: design.designer_id, designer_name: designer?.name },
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Cambio de estado
  if (design.status !== 'BACKLOG') {
    history.push({
      id: `h-${design.id}-3`,
      design_id: design.id,
      action: 'status_changed',
      actor_id: design.designer_id,
      actor_name: mockUsers.find(u => u.id === design.designer_id)?.name || 'Usuario',
      payload: { status: design.status },
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Última actualización
  if (design.updated_at) {
    history.push({
      id: `h-${design.id}-4`,
      design_id: design.id,
      action: 'updated',
      actor_id: design.designer_id || 'system',
      actor_name: mockUsers.find(u => u.id === design.designer_id)?.name || 'Sistema',
      payload: {},
      created_at: design.updated_at,
    });
  }

  // Ordenar por fecha descendente (más reciente primero)
  return history.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);

  useEffect(() => {
    if (!id) {
      setError('ID de diseño no proporcionado');
      setLoading(false);
      return;
    }

    fetch(`/api/designs/${id}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) {
            throw new Error('Diseño no encontrado');
          }
          throw new Error('Error al cargar diseño');
        }
        return r.json();
      })
      .then((data) => {
        setDesign(data);
        setHistory(generateHistory(data));
      })
      .catch((err) => {
        logger.error('Design fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <Loader variant="spinner" message="Cargando diseño..." />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="p-6">
        <ErrorState
          title="Error al cargar diseño"
          message={error || 'Diseño no encontrado'}
          onRetry={() => router.refresh()}
        />
      </div>
    );
  }

  const designer = design.designer_id 
    ? mockUsers.find((u) => u.id === design.designer_id)
    : null;

  const actionLabels: Record<string, string> = {
    created: 'Creado',
    assigned: 'Asignado',
    status_changed: 'Estado cambiado',
    updated: 'Actualizado',
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center gap-4 animate-slide-up">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/designs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
            {design.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{design.player} - {design.match_home} vs {design.match_away}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/designs?edit=${design.id}`}>
            <Edit2 className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información principal */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Información del Diseño</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
              <div className="mt-1">
                <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Deadline
              </label>
              <p className="mt-1 text-gray-800 dark:text-gray-200">
                {format(new Date(design.deadline_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
            {designer && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-400 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Diseñador asignado
                </label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{designer.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{designer.email}</p>
              </div>
            )}
            {design.folder_url && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Carpeta Drive</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={design.folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir carpeta
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Registro de cambios y acciones</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No hay historial disponible</p>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border-l-2 border-gray-300 dark:border-gray-700 pl-4 pb-4 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {actionLabels[item.action] || item.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Por: {item.actor_name}
                        </p>
                        {item.payload && Object.keys(item.payload).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-500">
                            {JSON.stringify(item.payload, null, 2)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-500">
                        {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

