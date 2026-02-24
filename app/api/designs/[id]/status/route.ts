import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!Object.prototype.hasOwnProperty.call(body, 'status')) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'designer_id')) {
    return NextResponse.json(
      { error: 'designer_id is not allowed in status endpoint' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
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

  const { data: originalDesign, error: originalError } = await supabase
    .from('designs')
    .select('designer_id, status')
    .eq('id', id)
    .single();

  if (originalError || !originalDesign) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  // Un diseñador solo puede mover el estado de sus propios diseños.
  if (profile?.role !== 'ADMIN' && originalDesign.designer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { status: body.status };

  if (body.status === 'DELIVERED') {
    updateData.delivered_at = new Date().toISOString();
  } else if (originalDesign.status === 'DELIVERED') {
    updateData.delivered_at = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('designs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(updated);
}
