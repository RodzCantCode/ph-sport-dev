import { NextResponse } from 'next/server';
import { shouldUseMockData } from '@/lib/demo-mode';
import { mockDesigns } from '@/lib/data/mock-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  if (shouldUseMockData()) {
    const design = mockDesigns.find((d) => d.id === id);
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    return NextResponse.json(design);
  }
  
  // MODO REAL: fetch from Supabase
  const { createClient } = await import('@/lib/supabase/server');
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
  
  if (shouldUseMockData()) {
    const index = mockDesigns.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    
    // Actualizar el diseño (preservar created_at, actualizar updated_at)
    const existing = mockDesigns[index];
    const now = new Date().toISOString();
    mockDesigns[index] = { 
      ...existing, 
      ...body,
      updated_at: now,
      created_at: existing.created_at || now, // Preservar created_at si existe o usar now
    } as typeof mockDesigns[number];
    return NextResponse.json(mockDesigns[index]);
  }
  
  // MODO REAL: update in Supabase
  const { createClient } = await import('@/lib/supabase/server');
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
  
  if (shouldUseMockData()) {
    const index = mockDesigns.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    mockDesigns.splice(index, 1);
    return NextResponse.json({ ok: true, message: 'Design deleted successfully' });
  }
  
  // MODO REAL: delete in Supabase
  const { createClient } = await import('@/lib/supabase/server');
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

