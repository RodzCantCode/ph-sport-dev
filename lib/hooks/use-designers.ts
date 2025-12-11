'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface Designer {
  id: string;
  name: string;
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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'DESIGNER');

        if (error) throw error;

        const mappedDesigners: Designer[] = (data || []).map(p => ({
          id: p.id,
          name: p.full_name || 'Sin nombre',
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
