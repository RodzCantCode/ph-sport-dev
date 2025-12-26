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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Determinar diseñador (automático o manual)
    let designerId = shared.designer_id;
    if (!designerId || designerId === 'auto') {
      designerId = await assignDesignerAutomatically();
    }

    // Preparar inserts
    const designsToInsert = designs.map((d) => ({
      title: d.title,
      player: d.player,
      player_status: d.player_status || null,
      match_home: shared.match_home,
      match_away: shared.match_away,
      deadline_at: shared.deadline_at,
      folder_url: shared.folder_url || null,
      designer_id: designerId || null,
      created_by: user.id,
      status: 'BACKLOG' as const,
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
