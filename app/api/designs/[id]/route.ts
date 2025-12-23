import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  const supabase = await createClient();
  
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Procesar designer_id si es 'auto' o null
  let designerId = body.designer_id;
  if (designerId === 'auto' || designerId === null || designerId === undefined) {
    const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
    designerId = await assignDesignerAutomatically(id); // Excluir el diseño actual del conteo
  }
  
  // Actualizar con el designer_id procesado
  const updateData = {
    ...body,
    designer_id: designerId,
  };
  
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

