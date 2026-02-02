import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

export interface Profile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'DESIGNER';
  created_at: string;
}

export interface InvitationUse {
  id: string;
  email: string;
  full_name: string;
  used_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  role: 'ADMIN' | 'DESIGNER';
  max_uses: number;
  expires_at: string | null;
  invitation_uses: InvitationUse[];
}

interface UsersData {
  users: Profile[];
  invitations: Invitation[];
}

interface UseUsersDataReturn {
  users: Profile[];
  invitations: Invitation[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetchUsersData = async (): Promise<UsersData> => {
  const supabase = createClient();

  // Load users
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: true });

  if (usersError) throw usersError;

  // Load all invitations with usage history
  const { data: invData, error: invError } = await supabase
    .from('invitations')
    .select(`
      id, token, role, max_uses, expires_at,
      invitation_uses (id, email, full_name, used_at)
    `)
    .order('created_at', { ascending: false });

  if (invError) throw invError;

  return {
    users: usersData || [],
    invitations: invData || [],
  };
};

export function useUsersData(): UseUsersDataReturn {
  const { profile, status } = useAuth();
  const isAdmin = status === 'AUTHENTICATED' && profile?.role === 'ADMIN';

  const { data, error, isLoading, mutate } = useSWR<UsersData>(
    // Only fetch when authenticated as admin
    isAdmin ? 'users-data' : null,
    fetchUsersData,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    users: data?.users ?? [],
    invitations: data?.invitations ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
