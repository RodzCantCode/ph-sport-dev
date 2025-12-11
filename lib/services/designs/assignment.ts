/**
 * Utilidades para asignación automática de diseños a diseñadores
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Calcula el diseñador con menor carga de trabajo usando algoritmo round-robin
 * @param excludeDesignId - ID del diseño a excluir del conteo (útil al actualizar)
 * @returns ID del diseñador seleccionado o null si no hay diseñadores disponibles
 */
export async function assignDesignerAutomatically(excludeDesignId?: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    // 1. Obtener todos los diseñadores
    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'DESIGNER');

    if (designersError) {
      logger.error('Error fetching designers for assignment:', designersError);
      return null;
    }

    if (!designers || designers.length === 0) {
      logger.warn('No designers found for assignment');
      return null;
    }

    // 2. Obtener diseños activos (no entregados) para contar carga
    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);

    if (designsError) {
      logger.error('Error fetching active designs for assignment:', designsError);
      return null;
    }

    // 3. Calcular carga por diseñador
    const taskCounts = new Map<string, number>();
    designers.forEach((d) => taskCounts.set(d.id, 0));

    activeDesigns?.forEach((d) => {
      // Asegurarse de que el designer_id existe en nuestra lista de diseñadores
      // y que no es el diseño que estamos excluyendo
      if (d.designer_id && taskCounts.has(d.designer_id)) {
        if (excludeDesignId && d.id === excludeDesignId) return;
        taskCounts.set(d.designer_id, (taskCounts.get(d.designer_id) || 0) + 1);
      }
    });

    // 4. Encontrar el diseñador con menos tareas
    let minCount = Infinity;
    let selectedDesignerId = designers[0].id;

    for (const designer of designers) {
      const count = taskCounts.get(designer.id) || 0;
      if (count < minCount) {
        minCount = count;
        selectedDesignerId = designer.id;
      }
    }

    return selectedDesignerId;

  } catch (error) {
    logger.error('Unexpected error in assignDesignerAutomatically:', error);
    return null;
  }
}


