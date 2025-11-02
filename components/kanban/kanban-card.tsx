'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Design } from '@/lib/types/design';
import { mockUsers } from '@/lib/mock-data';

interface KanbanCardProps {
  design: Design;
}

export function KanbanCard({ design }: KanbanCardProps) {
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
      type: 'design',
      design,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const designer = design.designer_id
    ? mockUsers.find((u) => u.id === design.designer_id)
    : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        cursor-grab active:cursor-grabbing
        hover:shadow-lg transition-all duration-300
        border border-gray-700/30 bg-gray-800/50
        ${isDragging ? 'ring-2 ring-orange-500/50' : ''}
      `}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/designs/${design.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-gray-200 hover:text-orange-400 transition-colors flex-1 hover:underline"
          >
            {design.title}
          </Link>
          <Badge status={design.status} className="shrink-0">
            {design.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{design.player}</span>
          </div>

          <div className="text-gray-300">
            <div className="font-medium">{design.match_home}</div>
            <div className="text-xs text-gray-500">vs</div>
            <div className="font-medium">{design.match_away}</div>
          </div>

          {designer && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User className="h-3 w-3" />
              <span className="truncate">{designer.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(design.deadline_at), "dd MMM, yyyy", { locale: es })}
            </span>
          </div>

          {design.folder_url && (
            <a
              href={design.folder_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir carpeta
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

