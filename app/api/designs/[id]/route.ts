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
  
  const { data: updated, error } = await supabase
    .from('designs')
    .update(body)
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
  
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: 'Design deleted successfully' });
}

