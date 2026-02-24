import { NextResponse } from 'next/server';
import { assignDesignerAutomatically } from '@/lib/services/designs/assignment';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Round-robin balanced assignment algorithm
 * Distribuye diseños sin asignar entre diseñadores de forma equilibrada
 */
export async function POST(_request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    logger.error('[API Assign] Role check error:', profileError);
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Obtener todos los diseños pendientes sin asignar
  const { data: unassigned, error } = await supabase
    .from('designs')
    .select('id')
    .is('designer_id', null)
    .eq('status', 'BACKLOG');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!unassigned || unassigned.length === 0) {
    return NextResponse.json({ message: 'No hay diseños sin asignar', assigned: 0 });
  }

  let assignedCount = 0;
  
  // Asignar cada diseño
  for (const design of unassigned) {
    const designerId = await assignDesignerAutomatically(design.id);
    if (designerId) {
      const { error: updateError } = await supabase
        .from('designs')
        .update({ designer_id: designerId })
        .eq('id', design.id);
        
      if (!updateError) {
        assignedCount++;
      }
    }
  }

  if (assignedCount === 0) {
    return NextResponse.json({ error: 'No se pudo asignar ningún diseño (posible falta de diseñadores)' }, { status: 400 });
  }

  return NextResponse.json({
    message: `Se asignaron ${assignedCount} diseño(s)`,
    assigned: assignedCount,
  });
}
