import { NextResponse } from 'next/server';
import { shouldUseMockData } from '@/lib/demo-mode';
import { mockDesigns } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  if (shouldUseMockData()) {
    const design = mockDesigns.find((d) => d.id === id);
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    return NextResponse.json(design);
  }
  // TODO: fetch from Supabase
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  if (shouldUseMockData()) {
    const index = mockDesigns.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    
    // Actualizar el diseño
    mockDesigns[index] = { ...mockDesigns[index], ...body };
    return NextResponse.json(mockDesigns[index]);
  }
  // TODO: update in Supabase with RLS
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (shouldUseMockData()) {
    return NextResponse.json({ ok: true });
  }
  // TODO: delete in Supabase
  return NextResponse.json({ ok: true });
}


