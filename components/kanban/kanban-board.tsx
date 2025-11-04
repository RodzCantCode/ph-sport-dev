'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import type { Design } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { toast } from 'sonner';

interface KanbanBoardProps {
  designs: Design[];
  loading?: boolean;
  onStatusChange: (designId: string, newStatus: DesignStatus) => Promise<void>;
  onCreateDesign?: () => void;
}

const COLUMNS: Array<{ status: DesignStatus; title: string }> = [
  { status: 'BACKLOG', title: 'Backlog' },
  { status: 'IN_PROGRESS', title: 'En Progreso' },
  { status: 'TO_REVIEW', title: 'Por Revisar' },
  { status: 'DELIVERED', title: 'Entregado' },
];

export function KanbanBoard({
  designs,
  loading = false,
  onStatusChange,
  onCreateDesign,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px para activar el drag (evita conflictos con clicks)
      },
    })
  );

  // Agrupar diseños por estado
  const designsByStatus = COLUMNS.reduce(
    (acc, column) => {
      acc[column.status] = designs.filter((d) => d.status === column.status);
      return acc;
    },
    {} as Record<DesignStatus, Design[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const designId = active.id as string;
    const newStatus = over.id as DesignStatus;

    // Encontrar el diseño actual
    const design = designs.find((d) => d.id === designId);
    if (!design) return;

    // Si el estado no cambió, no hacer nada
    if (design.status === newStatus) return;

    // Verificar que el nuevo estado sea válido
    const validStatuses: DesignStatus[] = ['BACKLOG', 'IN_PROGRESS', 'TO_REVIEW', 'DELIVERED'];
    if (!validStatuses.includes(newStatus)) return;

    try {
      await onStatusChange(designId, newStatus);
      toast.success(`Diseño movido a ${COLUMNS.find((c) => c.status === newStatus)?.title}`);
    } catch (error) {
      toast.error('Error al actualizar el estado del diseño');
      console.error('Error updating design status:', error);
    }
  };

  const activeDesign = activeId ? designs.find((d) => d.id === activeId) : null;

  if (loading) {
    return <Loader className="p-6" />;
  }

  if (designs.length === 0) {
    return (
      <EmptyState
        title="No hay diseños"
        description="Crea tu primer diseño para comenzar"
        actionLabel="Crear Diseño"
        onAction={onCreateDesign}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            designs={designsByStatus[column.status] || []}
            count={designsByStatus[column.status]?.length || 0}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDesign ? (
          <div className="rotate-3 opacity-90">
            <KanbanCard design={activeDesign} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

