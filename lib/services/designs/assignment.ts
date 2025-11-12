/**
 * Utilidades para asignación automática de diseños a diseñadores
 */

import { mockDesigns, mockUsers, type MockUser } from '@/lib/data/mock-data';

/**
 * Calcula el diseñador con menor carga de trabajo usando algoritmo round-robin
 * @param excludeDesignId - ID del diseño a excluir del conteo (útil al actualizar)
 * @returns ID del diseñador seleccionado o null si no hay diseñadores disponibles
 */
export function assignDesignerAutomatically(excludeDesignId?: string): string | null {
  const designers = mockUsers.filter((u) => u.role === 'designer');

  if (designers.length === 0) {
    return null;
  }

  const taskCounts = new Map<string, number>();
  designers.forEach((d) => taskCounts.set(d.id, 0));

  mockDesigns.forEach((d) => {
    if (excludeDesignId && d.id === excludeDesignId) {
      return;
    }

    if (d.designer_id && taskCounts.has(d.designer_id) && d.status !== 'DELIVERED') {
      taskCounts.set(d.designer_id, (taskCounts.get(d.designer_id) || 0) + 1);
    }
  });

  let minCount = Infinity;
  let selectedDesigner = designers[0];

  for (const designer of designers) {
    const count = taskCounts.get(designer.id) || 0;
    if (count < minCount) {
      minCount = count;
      selectedDesigner = designer;
    }
  }

  return selectedDesigner.id;
}

/**
 * Obtiene información del diseñador asignado
 */
export function getDesignerInfo(designerId: string | null | undefined): MockUser | null {
  if (!designerId) return null;
  return mockUsers.find((u) => u.id === designerId) || null;
}


