import useSWR from 'swr';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';
import { getDefaultWeekRange } from '@/lib/utils';
import type { Design } from '@/lib/types/design';

interface UseMyWeekReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<Design[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar las tareas');
  }
  const data = await response.json();
  return data.items || [];
};

export function useMyWeek(): UseMyWeekReturn {
  const { user, status } = useAuth();
  const { weekStart, weekEnd } = getDefaultWeekRange();

  // Build the URL with query params
  const url = user?.id
    ? `/api/designs?${new URLSearchParams({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        designerId: user.id,
      }).toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(
    // Only fetch when authenticated and have user id
    status === 'AUTHENTICATED' && url ? url : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
