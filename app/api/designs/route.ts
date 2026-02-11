import { NextResponse } from 'next/server';
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
