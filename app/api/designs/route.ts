import { NextResponse } from 'next/server';
import { shouldUseMockData } from '@/lib/demo-mode';
import { mockDesigns } from '@/lib/mock-data';
import type { WeekFilters, DesignStatus } from '@/lib/types/filters';

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

  const useMock = shouldUseMockData();
  console.log('[API] shouldUseMockData:', useMock, 'mockDesigns count:', mockDesigns.length);
  
  if (useMock) {
    // Normalize dates to start of day for comparison
    const start = new Date(filters.weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.weekEnd);
    end.setHours(23, 59, 59, 999);
    
    const items = mockDesigns.filter((d) => {
      const dDate = new Date(d.deadline_at);
      const inWeek = dDate >= start && dDate <= end;
      const statusOk = filters.status ? d.status === filters.status : true;
      const designerOk = filters.designerId ? d.designer_id === filters.designerId : true;
      return inWeek && statusOk && designerOk;
    });
    console.log('[API] Filtered items:', items.length, 'filters:', filters);
    return NextResponse.json({ items, count: items.length });
  }

  // TODO: Query Supabase with filters (week interval, status, designerId)
  return NextResponse.json({ items: [], count: 0 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ['title', 'player', 'match_home', 'match_away', 'deadline_at'];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
  }
  if (new Date(body.deadline_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'deadline_at must be in the future' }, { status: 400 });
  }

  if (shouldUseMockData()) {
    // En DEMO mode, añadir al array mockDesigns (aunque no persiste entre reinicios del servidor)
    // Para producción usaríamos Supabase
    const now = new Date().toISOString();
    const newDesign = {
      id: crypto.randomUUID(),
      ...body,
      status: 'BACKLOG' as const,
      created_at: now,
      updated_at: now,
    };
    
    // Añadir al array
    mockDesigns.push(newDesign);
    
    return NextResponse.json(newDesign, { status: 201 });
  }

  // TODO: Insert into Supabase
  return NextResponse.json({ id: crypto.randomUUID(), ...body, status: 'BACKLOG' }, { status: 201 });
}


