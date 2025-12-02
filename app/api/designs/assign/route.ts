import { NextResponse } from 'next/server';
import { assignDesignerAutomatically } from '@/lib/services/designs/assignment';
import { createClient } from '@/lib/supabase/server';

/**
 * Round-robin balanced assignment algorithm
 * Distribuye diseños sin asignar entre diseñadores de forma equilibrada
 */
export async function POST(_request: Request) {
  const supabase = await createClient();

  // Obtener todos los diseños sin asignar (BACKLOG y sin designer_id)
  const { data: unassigned, error } = await supabase
    .from('designs')
    .select('id')
    .is('designer_id', null)
    .in('status', ['BACKLOG', 'IN_PROGRESS']);

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


