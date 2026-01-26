'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import type { Design } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface KanbanBoardProps {
  designs: Design[];
  loading?: boolean;
  onStatusChange: (designId: string, newStatus: DesignStatus) => Promise<void>;
  onCreateDesign?: () => void;
  designers?: { id: string; name: string }[];
  syncingDesignId?: string | null;
  onCardClick?: (designId: string) => void;
  createDisabled?: boolean;
  createDisabledReason?: string;
}

const COLUMNS: Array<{ status: DesignStatus; title: string }> = [
  { status: 'BACKLOG', title: 'Pendiente' },
  { status: 'IN_PROGRESS', title: 'En Progreso' },
  { status: 'TO_REVIEW', title: 'En Revisión' },
  { status: 'DELIVERED', title: 'Entregado' },
];

/**
 * Custom collision detection strategy that prioritizes pointer position
 * over center-based calculations for more accurate drop zone detection.
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin - most accurate for user's cursor position
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // Then rectIntersection as fallback for edge cases
  const intersectionCollisions = rectIntersection(args);
  if (intersectionCollisions.length > 0) {
    return intersectionCollisions;
  }
  
  // Finally closestCenter as last resort
  return closestCenter(args);
};

export function KanbanBoard({
  designs,
  loading = false,
  onStatusChange,
  onCreateDesign,
  designers,
  syncingDesignId,
  onCardClick,
  createDisabled = false,
  createDisabledReason,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    })
  );

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

  const handleDragOver = (event: DragOverEvent) => {
    // Proporcionar feedback visual durante el drag
    const { over } = event;
    if (!over) return;
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const designId = active.id as string;
    // over.id puede ser el ID de una tarjeta (sortable) o el ID del contenedor (estado)
    let newStatus = over.id as DesignStatus;

    const validStatuses: DesignStatus[] = ['BACKLOG', 'IN_PROGRESS', 'TO_REVIEW', 'DELIVERED'];

    // Si el over.id no es un estado válido, intentar obtener el contenedor del elemento sobre el que se soltó
    if (!validStatuses.includes(newStatus)) {
      type OverData = { sortable?: { containerId?: string } } | undefined;
      const overData = over.data?.current as OverData;
      const containerId = overData?.sortable?.containerId;
      if (containerId && validStatuses.includes(containerId as DesignStatus)) {
        newStatus = containerId as DesignStatus;
      } else {
        // No se pudo determinar un estado destino válido
        return;
      }
    }

    const design = designs.find((d) => d.id === designId);
    if (!design) return;

    if (design.status === newStatus) return;

    // En este punto newStatus es un estado válido

    try {
      await onStatusChange(designId, newStatus);
      toast.success(`Diseño movido a ${COLUMNS.find((c) => c.status === newStatus)?.title}`);
    } catch (error) {
      toast.error('Error al actualizar el estado del diseño');
      logger.error('Error updating design status:', error);
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
        actionDisabled={createDisabled}
        actionDisabledReason={createDisabledReason}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
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
            designers={designers}
            syncingDesignId={syncingDesignId}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDesign ? (
          <div className="rotate-3 scale-105 transition-all duration-200 shadow-2xl">
            <KanbanCard 
              design={activeDesign} 
              designer={designers?.find(d => d.id === activeDesign.designer_id)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
