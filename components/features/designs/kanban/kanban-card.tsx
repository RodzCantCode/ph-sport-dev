'use client';

import { useSortable, AnimateLayoutChanges, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ExternalLink, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Design } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

interface KanbanCardProps {
  design: Design;
  designer?: { name: string } | null;
  isSyncing?: boolean;
  onCardClick?: (designId: string) => void;
}

export function KanbanCard({ design, designer, isSyncing = false, onCardClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: design.id,
    data: {
      type: 'Design',
      design,
    },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        hover:shadow-lg hover:scale-[1.01] 
        transition-all duration-300 ease-out
        border border-gray-300/30 dark:border-gray-700/30 bg-gray-100/50 dark:bg-gray-800/50
        relative overflow-hidden
        ${isDragging ? 'ring-2 ring-orange-500/50 shadow-2xl' : ''}
        ${isSyncing ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCardClick?.(design.id);
            }}
            className="font-semibold text-gray-800 dark:text-gray-200 hover:text-orange-400 transition-colors flex-1 hover:underline leading-tight text-left"
          >
            {design.title}
          </button>
          
          {design.player_status && (
            <PlayerStatusTag status={design.player_status} />
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          {/* Partido en una línea */}
          <div className="text-gray-700 dark:text-gray-300 font-medium text-sm truncate">
            {design.match_home} vs {design.match_away}
          </div>

          {/* Meta info compacta en una línea */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            {designer && (
              <>
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{designer.name}</span>
                <span className="text-gray-500 dark:text-gray-600">•</span>
              </>
            )}
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{format(new Date(design.deadline_at), 'dd MMM', { locale: es })}</span>
            {design.folder_url && (
              <>
                <span className="text-gray-500 dark:text-gray-600">•</span>
                <a
                  href={design.folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors"
                  title="Abrir carpeta Drive"
                  aria-label="Abrir carpeta Drive"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
