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
    <div className="flex flex-col h-full min-h-[600px] max-h-[calc(100vh-200px)]">
      <Card
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col overflow-hidden
          border-2 transition-colors duration-200
          ${isOver ? 'border-orange-400 bg-orange-500/10' : 'border-gray-300/30 dark:border-gray-700/30 bg-gray-100/30 dark:bg-gray-800/30'}
        `}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
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
        <CardContent className="flex-1 overflow-y-auto overflow-x-hidden pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="space-y-3 min-h-[300px] pb-4">
            <SortableContext items={designs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              {designs.length === 0 ? (
                <div className={`
                  text-center py-12 px-4 rounded-lg border-2 border-dashed
                  transition-colors duration-200
                  ${isOver 
                    ? 'border-orange-400 bg-orange-500/10 text-orange-400' 
                    : 'border-gray-300/30 dark:border-gray-700/30 text-gray-600 dark:text-gray-500'
                  }
                `}>
                  <p className="text-sm font-medium">
                    {isOver ? '¡Suelta aquí!' : 'Sin diseños'}
                  </p>
                </div>
              ) : (
                designs.map((design) => <KanbanCard key={design.id} design={design} />)
              )}
            </SortableContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
