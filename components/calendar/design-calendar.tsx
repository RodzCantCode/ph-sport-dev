'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput } from '@fullcalendar/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DesignItem {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  folder_url?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'TO_REVIEW' | 'DELIVERED';
  designer_id?: string;
  deadline_at: string;
}

interface DesignCalendarProps {
  items: DesignItem[];
  onEventClick?: (item: DesignItem) => void;
}

const statusColors: Record<string, { background: string; border: string; text: string }> = {
  BACKLOG: {
    background: 'rgba(107, 114, 128, 0.2)', // gray-500/20
    border: 'rgba(107, 114, 128, 0.5)', // gray-500
    text: '#d1d5db', // gray-300
  },
  IN_PROGRESS: {
    background: 'rgba(249, 115, 22, 0.3)', // orange-500/30
    border: 'rgba(249, 115, 22, 0.8)', // orange-500
    text: '#fb923c', // orange-400
  },
  TO_REVIEW: {
    background: 'rgba(234, 179, 8, 0.3)', // yellow-500/30
    border: 'rgba(234, 179, 8, 0.8)', // yellow-500
    text: '#fbbf24', // amber-400
  },
  DELIVERED: {
    background: 'rgba(34, 197, 94, 0.3)', // green-500/30
    border: 'rgba(34, 197, 94, 0.8)', // green-500
    text: '#4ade80', // green-400
  },
};

export function DesignCalendar({ items, onEventClick }: DesignCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Convertir items a eventos de FullCalendar
  const events: EventInput[] = items.map((item) => {
    const statusColor = statusColors[item.status] || statusColors.BACKLOG;
    return {
      id: item.id,
      title: item.title,
      start: item.deadline_at,
      allDay: false,
      backgroundColor: statusColor.background,
      borderColor: statusColor.border,
      textColor: statusColor.text,
      extendedProps: {
        item: item,
      },
    };
  });

  const handleEventClick = (info: { event: { extendedProps: { item: DesignItem } } }) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps.item);
    }
  };

  return (
    <div className="glass-effect rounded-xl p-4 md:p-6">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        locales={[esLocale]}
        locale="es"
        firstDay={1} // Lunes
        height="auto"
        contentHeight="auto"
        eventDisplay="block"
        dayMaxEvents={4}
        moreLinkText="más"
        eventMouseEnter={(info) => {
          // Tooltip en hover con información adicional
          const item = info.event.extendedProps.item as DesignItem;
          info.el.title = `${item.title}\n${item.match_home} vs ${item.match_away}\n${item.player}\nEstado: ${item.status}\n${format(new Date(item.deadline_at), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}`;
        }}
        eventClassNames="fc-event-custom"
        className="fc-calendar-custom"
      />
    </div>
  );
}

