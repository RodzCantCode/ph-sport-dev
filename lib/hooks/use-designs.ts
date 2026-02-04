import useSWR from 'swr';
import { format } from 'date-fns';
import type { Design } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';

interface UseDesignsParams {
  weekStart: Date | undefined;
  weekEnd: Date | undefined;
  statusFilter?: DesignStatus | 'all';
  designerFilter?: string | 'all';
}

interface UseDesignsReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<Design[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar los diseños');
  }
  const data = await response.json();
  return data.items || [];
};

export function useDesigns({
  weekStart,
  weekEnd,
  statusFilter = 'all',
  designerFilter = 'all',
}: UseDesignsParams): UseDesignsReturn {
  // Build URL only when we have valid dates
  const url =
    weekStart && weekEnd
      ? `/api/designs?${new URLSearchParams({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(designerFilter !== 'all' ? { designerId: designerFilter } : {}),
        }).toString()}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(url, fetcher);

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
