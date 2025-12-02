'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface Designer {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export function useDesigners() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDesigners = async () => {
      try {
        const supabase = createClient();
        
        // Obtener perfiles con rol 'designer'
        // Nota: Asumimos que la tabla profiles tiene columna 'role'
        // Si el rol está en metadata de auth, habría que cambiar la estrategia,
        // pero según get-current-user.ts, está en la tabla profiles.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, email') // Asegúrate de que email esté en profiles o haz join
          .eq('role', 'DESIGNER'); // O 'designer' dependiendo de cómo se guarde (case sensitive)

        if (error) throw error;

        // Si no hay email en profiles, quizás necesitemos obtenerlo de otra forma o ignorarlo
        // Por ahora asumimos que profiles tiene lo necesario o mapeamos lo que hay
        const mappedDesigners: Designer[] = (data || []).map(p => ({
          id: p.id,
          name: p.full_name || 'Sin nombre',
          email: p.email || '', // Si no está en profiles, vendrá vacío
        }));

        setDesigners(mappedDesigners);
      } catch (err) {
        logger.error('Error loading designers:', err);
        setError('Error al cargar diseñadores');
      } finally {
        setLoading(false);
      }
    };

    loadDesigners();
  }, []);

  return { designers, loading, error };
}
