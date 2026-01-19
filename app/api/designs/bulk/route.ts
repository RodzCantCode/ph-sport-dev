import { NextResponse } from 'next/server';
import { assignDesignerAutomatically } from '@/lib/services/designs/assignment';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

interface BulkDesign {
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: string;
  designer_id?: string | null;
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null;
  folder_url?: string;
}

interface BulkCreateRequest {
  designs: BulkDesign[];
}

export async function POST(request: Request) {
  try {
    const body: BulkCreateRequest = await request.json();

    // Validar estructura básica
    if (!body.designs || !Array.isArray(body.designs)) {
      return NextResponse.json(
        { error: 'Formato inválido: se requiere designs[]' },
        { status: 400 }
      );
    }

    const { designs } = body;

    // Validar que haya al menos un diseño
    if (designs.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un diseño' },
        { status: 400 }
      );
    }

    // Validar campos por diseño (title ahora es opcional, fallback a player)
    const requiredFields = ['player', 'match_home', 'match_away', 'deadline_at'];
    for (let i = 0; i < designs.length; i++) {
      const d = designs[i];
      const missing = requiredFields.filter((f) => !d[f as keyof BulkDesign]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Diseño ${i + 1}: campos faltantes: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validar fechas
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (let i = 0; i < designs.length; i++) {
      if (new Date(designs[i].deadline_at).getTime() < oneHourAgo) {
        return NextResponse.json(
          { error: `Diseño ${i + 1}: la fecha límite no puede ser anterior a hace 1 hora` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Preparar inserts, asignando diseñador automáticamente si no se especifica
    const designsToInsert = await Promise.all(
      designs.map(async (d) => {
        let designerId = d.designer_id;
        if (!designerId || designerId === 'auto') {
          designerId = await assignDesignerAutomatically();
        }

        // Si no hay título, usar el nombre del jugador
        const title = d.title?.trim() || d.player;

        return {
          title,
          player: d.player,
          player_status: d.player_status || null,
          match_home: d.match_home,
          match_away: d.match_away,
          deadline_at: d.deadline_at,
          folder_url: d.folder_url || null,
          designer_id: designerId || null,
          created_by: user.id,
          status: 'BACKLOG' as const,
        };
      })
    );

    // Insert batch
    const { data: createdDesigns, error } = await supabase
      .from('designs')
      .insert(designsToInsert)
      .select();

    if (error) {
      logger.error('[API Bulk] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      created: createdDesigns?.length || 0,
      failed: designs.length - (createdDesigns?.length || 0),
      designs: createdDesigns || [],
    }, { status: 201 });

  } catch (error) {
    logger.error('[API Bulk] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
