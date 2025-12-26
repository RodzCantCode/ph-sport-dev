'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Edit2, ExternalLink, Calendar, User, X } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { CommentsSection } from '@/components/features/comments/comments-section';

interface DesignDetailSheetProps {
  designId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignUpdated?: () => void;
}

export function DesignDetailSheet({
  designId,
  open,
  onOpenChange,
  onDesignUpdated,
}: DesignDetailSheetProps) {
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { designers } = useDesigners();

  useEffect(() => {
    if (!designId || !open) {
      setDesign(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/designs/${designId}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error('Diseño no encontrado');
          throw new Error('Error al cargar diseño');
        }
        return r.json();
      })
      .then((data) => setDesign(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [designId, open]);

  const designer = design?.designer_id ? designers.find((u) => u.id === design.designer_id) : null;

  const handleEditComplete = () => {
    // Refresh design data
    if (designId) {
      fetch(`/api/designs/${designId}`)
        .then((r) => r.json())
        .then((data) => setDesign(data));
    }
    onDesignUpdated?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" hideCloseButton>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader variant="default" message="Cargando..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          ) : design ? (
            <>
              <SheetHeader className="pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                      {design.title}
                    </SheetTitle>
                    <SheetDescription className="mt-1">
                      {design.player} · {design.match_home} vs {design.match_away}
                    </SheetDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsEditDialogOpen(true)}
                      className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors group"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-orange-400" />
                    </button>
                    <button
                      onClick={() => onOpenChange(false)}
                      className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors group"
                      title="Cerrar"
                    >
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-orange-400" />
                    </button>
                  </div>
                </div>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </span>
                  <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                </div>

                {/* Player Status */}
                {design.player_status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Estado del Jugador
                    </span>
                    <PlayerStatusTag status={design.player_status} />
                  </div>
                )}

                {/* Deadline */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de entrega
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(design.deadline_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </span>
                </div>

                {/* Designer */}
                {designer && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Diseñador
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {designer.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Folder URL */}
                {design.folder_url && (
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={design.folder_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir carpeta en Drive
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <CommentsSection designId={design.id} />
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {design && (
        <CreateDesignDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onDesignCreated={handleEditComplete}
          design={design}
        />
      )}
    </>
  );
}
