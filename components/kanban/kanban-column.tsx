'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './kanban-card';
import type { Design } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { STATUS_COLORS } from '@/lib/types/design';

interface KanbanColumnProps {
  status: DesignStatus;
  title: string;
  designs: Design[];
  count: number;
}

export function KanbanColumn({ status, title, designs, count }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const colors = STATUS_COLORS[status];

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <Card
        className={`
          flex-1 flex flex-col
          border-2 transition-colors duration-200
          ${isOver ? 'border-orange-400 bg-orange-500/10' : 'border-gray-700/30 bg-gray-800/30'}
        `}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              {title}
            </CardTitle>
            <Badge
              className="shrink-0"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              {count}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pb-4">
          <div
            ref={setNodeRef}
            className="space-y-3 min-h-[200px]"
          >
            <SortableContext items={designs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              {designs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Sin diseños
                </div>
              ) : (
                designs.map((design) => (
                  <KanbanCard key={design.id} design={design} />
                ))
              )}
            </SortableContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

