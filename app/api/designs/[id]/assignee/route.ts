import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!Object.prototype.hasOwnProperty.call(body, 'designer_id')) {
    return NextResponse.json({ error: 'designer_id is required' }, { status: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    return NextResponse.json(
      { error: 'status is not allowed in assignee endpoint' },
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

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let designerId = body.designer_id;
  if (designerId === 'auto' || designerId === null || designerId === undefined) {
    const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
    designerId = await assignDesignerAutomatically(id);
  }

  const { data: updated, error: updateError } = await supabase
    .from('designs')
    .update({ designer_id: designerId })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(updated);
}
