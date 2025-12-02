'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, Edit2, ExternalLink, Calendar, User } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { designers } = useDesigners();

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
    ? designers.find((u) => u.id === design.designer_id)
    : null;

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
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <CreateDesignDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onDesignCreated={() => {
          // Recargar datos
          setLoading(true);
          fetch(`/api/designs/${id}`)
            .then((r) => r.json())
            .then((data) => {
              setDesign(data);
            })
            .finally(() => setLoading(false));
        }}
        design={design}
      />

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

        {/* Historial (Placeholder o eliminado por ahora) */}
        {/* TODO: Implementar historial real con Supabase */}
      </div>
    </div>
  );
}

