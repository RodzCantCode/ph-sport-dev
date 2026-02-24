import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json(design);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  const supabase = await createClient();
  
  // Obtener usuario actual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasStatusInBody = Object.prototype.hasOwnProperty.call(body, 'status');
  const hasDesignerInBody = Object.prototype.hasOwnProperty.call(body, 'designer_id');

  // Evita operaciones ambiguas que mezclen dos intenciones distintas.
  if (hasStatusInBody && hasDesignerInBody) {
    return NextResponse.json(
      { error: 'Ambiguous payload: status and designer_id cannot be updated together' },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (hasDesignerInBody && profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Obtener el diseño actual ANTES de actualizarlo (para comparar designer_id)
  const { data: originalDesign } = await supabase
    .from('designs')
    .select('designer_id, title, status')
    .eq('id', id)
    .single();
  
  const updateData = { ...body };

  if (hasStatusInBody) {
    // Compatibilidad temporal: seguimos aceptando status por esta ruta.
    console.warn('[DEPRECATED] PUT /api/designs/:id status update. Use /api/designs/:id/status');
    if (body.status === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString();
    } else if (originalDesign?.status === 'DELIVERED') {
      updateData.delivered_at = null;
    }
  }

  // Solo procesar designer_id si viene explícitamente en la request
  if (hasDesignerInBody) {
    let designerId = body.designer_id;
    if (designerId === 'auto' || designerId === null || designerId === undefined) {
      const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
      designerId = await assignDesignerAutomatically(id); // Excluir el diseño actual del conteo
    }

    updateData.designer_id = designerId;
  }
  
  const { data: updated, error } = await supabase
    .from('designs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  const supabase = await createClient();
  
  // Verificar que hay usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: 'Design deleted successfully' });
}
