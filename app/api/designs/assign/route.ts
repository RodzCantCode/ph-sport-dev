import { NextResponse } from 'next/server';
import { shouldUseMockData } from '@/lib/demo-mode';
import { mockDesigns, mockUsers } from '@/lib/mock-data';

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

  // Obtener solo diseñadores (no managers)
  const designers = mockUsers.filter((u) => u.role === 'designer');

  if (designers.length === 0) {
    return NextResponse.json({ error: 'No hay diseñadores disponibles' }, { status: 400 });
  }

  // Contar tareas actuales por diseñador (para balance)
  const taskCounts = new Map<string, number>();
  designers.forEach((d) => taskCounts.set(d.id, 0));
  mockDesigns.forEach((d) => {
    if (d.designer_id && taskCounts.has(d.designer_id)) {
      taskCounts.set(d.designer_id, (taskCounts.get(d.designer_id) || 0) + 1);
    }
  });

  // Round-robin: asignar según menor carga actual
  let assigned = 0;
  unassigned.forEach((design) => {
    // Encontrar diseñador con menor carga
    let minCount = Infinity;
    let selectedDesigner = designers[0];

    for (const designer of designers) {
      const count = taskCounts.get(designer.id) || 0;
      if (count < minCount) {
        minCount = count;
        selectedDesigner = designer;
      }
    }

    // Asignar
    design.designer_id = selectedDesigner.id;
    taskCounts.set(selectedDesigner.id, (taskCounts.get(selectedDesigner.id) || 0) + 1);
    assigned++;
  });

  return NextResponse.json({
    message: `Se asignaron ${assigned} diseño(s)`,
    assigned,
  });
}


