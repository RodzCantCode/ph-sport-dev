import useSWR from 'swr';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { Design } from '@/lib/types/design';

interface UseDashboardReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<Design[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar los datos del dashboard');
  }
  const data = await response.json();
  return data.items || [];
};

export function useDashboard(): UseDashboardReturn {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const url = `/api/designs?${new URLSearchParams({
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
  }).toString()}`;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(url, fetcher);

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
