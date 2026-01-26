import { NextResponse } from 'next/server';
import { assignDesignerAutomatically } from '@/lib/services/designs/assignment';
import type { WeekFilters, DesignStatus } from '@/lib/types/filters';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: WeekFilters = {
    weekStart: searchParams.get('weekStart') || '',
    weekEnd: searchParams.get('weekEnd') || '',
    status: (searchParams.get('status') as DesignStatus) || undefined,
    designerId: searchParams.get('designerId') || undefined,
  };

  if (!filters.weekStart || !filters.weekEnd) {
    return NextResponse.json({ error: 'weekStart and weekEnd are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const weekStartDate = new Date(filters.weekStart);
  weekStartDate.setHours(0, 0, 0, 0);
  const weekEndDate = new Date(filters.weekEnd);
  weekEndDate.setHours(23, 59, 59, 999);

  let query = supabase
    .from('designs')
    .select('*')
    .gte('deadline_at', weekStartDate.toISOString())
    .lte('deadline_at', weekEndDate.toISOString());
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.designerId) {
    query = query.eq('designer_id', filters.designerId);
  }
  
  const { data: items, error } = await query;
  
  if (error) {
    logger.log('[API] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ items: items || [], count: items?.length || 0 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ['title', 'player', 'match_home', 'match_away', 'deadline_at'];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
  }

  // Permitir fechas hasta 1 hora en el pasado para evitar problemas de sincronización o "just now"
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (new Date(body.deadline_at).getTime() < oneHourAgo) {
    return NextResponse.json({ error: 'La fecha límite no puede ser anterior a hace 1 hora' }, { status: 400 });
  }

  const supabase = await createClient();


  // Obtener usuario actual
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError) {
    logger.error('[API] Role check error:', profileError);
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Si designer_id es null, undefined o 'auto', asignar automáticamente
  let designerId = body.designer_id;
  if (!designerId || designerId === 'auto' || designerId === null) {
    designerId = await assignDesignerAutomatically();
  }
  
  
  const { data: newDesign, error } = await supabase
    .from('designs')
    .insert({
      title: body.title,
      player: body.player,
      match_home: body.match_home,
      match_away: body.match_away,
      folder_url: body.folder_url,
      deadline_at: body.deadline_at,
      designer_id: designerId || null,
      created_by: userData.user.id,
      status: 'BACKLOG',
      player_status: body.player_status || null,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(newDesign, { status: 201 });
}
