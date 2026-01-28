import { NextResponse } from 'next/server';
import { assignDesignerAutomatically } from '@/lib/services/designs/assignment';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

interface BatchDesignItem {
  title: string;
  player: string;
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null;
}

interface BatchCreateRequest {
  shared: {
    match_home: string;
    match_away: string;
    deadline_at: string;
    designer_id?: string | null;
    folder_url?: string;
  };
  designs: BatchDesignItem[];
}

export async function POST(request: Request) {
  try {
    const body: BatchCreateRequest = await request.json();

    // Validar estructura básica
    if (!body.shared || !body.designs || !Array.isArray(body.designs)) {
      return NextResponse.json(
        { error: 'Formato inválido: se requiere shared y designs[]' },
        { status: 400 }
      );
    }

    // Validar campos compartidos
    const { shared, designs } = body;
    const requiredShared = ['match_home', 'match_away', 'deadline_at'];
    const missingShared = requiredShared.filter((k) => !shared[k as keyof typeof shared]);
    if (missingShared.length) {
      return NextResponse.json(
        { error: `Campos compartidos faltantes: ${missingShared.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar que haya al menos un diseño
    if (designs.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un diseño' },
        { status: 400 }
      );
    }

    // Validar campos por diseño
    for (let i = 0; i < designs.length; i++) {
      const d = designs[i];
      if (!d.title || !d.player) {
        return NextResponse.json(
          { error: `Diseño ${i + 1}: título y jugador son requeridos` },
          { status: 400 }
        );
      }
    }

    // Validar fecha
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (new Date(shared.deadline_at).getTime() < oneHourAgo) {
      return NextResponse.json(
        { error: 'La fecha límite no puede ser anterior a hace 1 hora' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener usuario actual
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error('[API Batch] Role check error:', profileError);
      return NextResponse.json({ error: 'Error al verificar permisos' }, { status: 500 });
    }

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // Determinar diseñador (automático o manual)
    let designerId = shared.designer_id;
    if (!designerId || designerId === 'auto') {
      designerId = await assignDesignerAutomatically();
    }

    // Preparar inserts
    // suppress_assignment_notification evita que el trigger genere notificaciones individuales
    // porque más abajo generamos una notificación agregada por diseñador
    const designsToInsert = designs.map((d) => ({
      title: d.title,
      player: d.player,
      player_status: d.player_status || null,
      match_home: shared.match_home,
      match_away: shared.match_away,
      deadline_at: shared.deadline_at,
      folder_url: shared.folder_url || null,
      designer_id: designerId || null,
      created_by: data.user.id,
      status: 'BACKLOG' as const,
      suppress_assignment_notification: true,
    }));

    // Insert batch
    const { data: createdDesigns, error } = await supabase
      .from('designs')
      .insert(designsToInsert)
      .select();

    if (error) {
      logger.error('[API Batch] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (createdDesigns && createdDesigns.length > 0) {
      // Agrupar diseños por diseñador para notificar en bloque
      const designerMap = new Map<string, number>();

      createdDesigns.forEach((d) => {
        if (d.designer_id) {
          const currentCount = designerMap.get(d.designer_id) || 0;
          designerMap.set(d.designer_id, currentCount + 1);
        }
      });

      const notifications = [];
      for (const [designerId, count] of designerMap.entries()) {
        notifications.push({
          user_id: designerId,
          type: 'assignment',
          title: 'Nuevas asignaciones',
          message: `Se te han asignado ${count} nuevos diseños`,
          link: '/my-week',
          read: false,
        });
      }

      if (notifications.length > 0) {
        try {
          await supabase.from('notifications').insert(notifications);
        } catch (notifError) {
          logger.error('[API Batch] Error sending notifications:', notifError);
        }
      }
    }

    return NextResponse.json({
      created: createdDesigns?.length || 0,
      failed: designs.length - (createdDesigns?.length || 0),
      designs: createdDesigns || [],
    }, { status: 201 });

  } catch (error) {
    logger.error('[API Batch] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
