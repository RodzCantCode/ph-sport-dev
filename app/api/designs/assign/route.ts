import { NextResponse } from 'next/server';
import { shouldUseMockData } from '@/lib/demo-mode';
import { mockDesigns } from '@/lib/mock-data';
import { assignDesignerAutomatically } from '@/lib/utils/assignment';

/**
 * Round-robin balanced assignment algorithm
 * Distribuye diseños sin asignar entre diseñadores de forma equilibrada
 */
export async function POST(_request: Request) {
  if (!shouldUseMockData()) {
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  }

  // Obtener todos los diseños sin asignar (BACKLOG y sin designer_id)
  const unassigned = mockDesigns.filter(
    (d) => !d.designer_id && (d.status === 'BACKLOG' || d.status === 'IN_PROGRESS')
  );

  if (unassigned.length === 0) {
    return NextResponse.json({ message: 'No hay diseños sin asignar', assigned: 0 });
  }

  // Asignar cada diseño sin asignar usando la función helper
  let assigned = 0;
  unassigned.forEach((design) => {
    const designerId = assignDesignerAutomatically(design.id);
    if (designerId) {
      design.designer_id = designerId;
      assigned++;
    }
  });

  if (assigned === 0) {
    return NextResponse.json({ error: 'No hay diseñadores disponibles' }, { status: 400 });
  }

  return NextResponse.json({
    message: `Se asignaron ${assigned} diseño(s)`,
    assigned,
  });
}


