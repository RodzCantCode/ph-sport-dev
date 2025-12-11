// Tipos unificados para la aplicación PH Sport
// Estos tipos se usan tanto en modo demo como en producción

import type { DesignStatus } from './filters';

// Tipo de estado del diseño (ya definido en filters.ts pero lo re-exportamos)
export type { DesignStatus } from './filters';

// Color mapping por estado para UI consistente
export const STATUS_COLORS = {
  BACKLOG: {
    background: 'rgba(107, 114, 128, 0.2)', // gray-500/20
    border: 'rgba(107, 114, 128, 0.5)', // gray-500
    text: '#d1d5db', // gray-300
    badgeVariant: 'outline' as const,
  },
  IN_PROGRESS: {
    background: 'rgba(249, 115, 22, 0.3)', // orange-500/30
    border: 'rgba(249, 115, 22, 0.8)', // orange-500
    text: '#fb923c', // orange-400
    badgeVariant: 'secondary' as const,
  },
  TO_REVIEW: {
    background: 'rgba(234, 179, 8, 0.3)', // yellow-500/30
    border: 'rgba(234, 179, 8, 0.8)', // yellow-500
    text: '#fbbf24', // amber-400
    badgeVariant: 'default' as const,
  },
  DELIVERED: {
    background: 'rgba(34, 197, 94, 0.3)', // green-500/30
    border: 'rgba(34, 197, 94, 0.8)', // green-500
    text: '#4ade80', // green-400
    badgeVariant: 'secondary' as const,
  },
} as const;

// Etiquetas legibles por estado
export const STATUS_LABELS: Record<DesignStatus, string> = {
  BACKLOG: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  TO_REVIEW: 'En Revisión',
  DELIVERED: 'Entregado',
};

// Flujo de transiciones permitidas entre estados
export const STATUS_FLOW: Record<DesignStatus, DesignStatus[]> = {
  BACKLOG: ['IN_PROGRESS'],
  IN_PROGRESS: ['TO_REVIEW'],
  TO_REVIEW: ['DELIVERED'],
  DELIVERED: [],
};

// Interfaz unificada para Design (compatible con MockDesign y Supabase)
export interface Design {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute'; // Estado del jugador
  folder_url?: string;
  deadline_at: string; // ISO 8601 string
  status: DesignStatus;
  designer_id?: string;
  created_at?: string; // ISO 8601 string (opcional, para historial)
  updated_at?: string; // ISO 8601 string (opcional, para historial)
  created_by?: string; // UUID (opcional)
  reviewed_by?: string; // UUID (opcional)
  delivered_at?: string; // ISO 8601 string (opcional)
}

// Input para crear un nuevo design
export interface CreateDesignInput {
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  folder_url?: string;
  deadline_at: string; // ISO 8601 string
  designer_id?: string;
}

// Input para actualizar un design
export interface UpdateDesignInput {
  title?: string;
  player?: string;
  match_home?: string;
  match_away?: string;
  folder_url?: string;
  deadline_at?: string;
  status?: DesignStatus;
  designer_id?: string;
}

// Historial de cambios (para detalle de design)
export interface DesignHistoryItem {
  id: string;
  design_id: string;
  action: string; // 'created', 'updated', 'status_changed', 'assigned', etc.
  actor_id?: string;
  actor_name?: string;
  payload?: Record<string, unknown>;
  created_at: string; // ISO 8601 string
}
