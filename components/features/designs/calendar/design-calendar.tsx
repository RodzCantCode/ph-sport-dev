'use client';

import { useRef } from 'react';
import { useTheme } from 'next-themes';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput, EventClickArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/types/design';
import type { Design } from '@/lib/types/design';

interface DesignCalendarProps {
  items: Design[];
  onEventClick?: (item: Design) => void;
}

function DesignCalendar({ items, onEventClick }: DesignCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Colores para modo claro
  const lightStatusColors = {
    BACKLOG: {
      background: 'rgba(107, 114, 128, 0.3)', // gray-500/30
      border: 'rgba(107, 114, 128, 0.6)', // gray-500
      text: '#374151', // gray-700
    },
    IN_PROGRESS: {
      background: 'rgba(249, 115, 22, 0.2)', // orange-500/20
      border: 'rgba(249, 115, 22, 0.8)', // orange-500
      text: '#ea580c', // orange-600
    },
    TO_REVIEW: {
      background: 'rgba(234, 179, 8, 0.25)', // yellow-500/25
      border: 'rgba(234, 179, 8, 0.8)', // yellow-500
      text: '#ca8a04', // yellow-600
    },
    DELIVERED: {
      background: 'rgba(34, 197, 94, 0.2)', // green-500/20
      border: 'rgba(34, 197, 94, 0.8)', // green-500
      text: '#16a34a', // green-600
    },
  };

  const events: EventInput[] = items.map((item) => {
    const statusColor = isDark 
      ? STATUS_COLORS[item.status] || STATUS_COLORS.BACKLOG
      : lightStatusColors[item.status] || lightStatusColors.BACKLOG;
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

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      const item = info.event.extendedProps.item as Design;
      onEventClick(item);
    }
  };

  return (
    <div className="glass-effect rounded-xl p-4 md:p-6 fc-calendar-custom">
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
        firstDay={1}
        height="auto"
        contentHeight="auto"
        eventDisplay="block"
        dayMaxEvents={4}
        moreLinkText="más"
        eventMouseEnter={(info) => {
          const item = info.event.extendedProps.item as Design;
          info.el.title = `${item.title}\n${item.match_home} vs ${item.match_away}\n${item.player}\nEstado: ${STATUS_LABELS[item.status]}\n${format(
            new Date(item.deadline_at),
            "dd 'de' MMMM 'a las' HH:mm",
            { locale: es }
          )}`;
        }}
        eventClassNames="fc-event-custom"
      />
    </div>
  );
}

export default DesignCalendar;





