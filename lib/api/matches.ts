import { mockMatches, mockAssets, mockUsers } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/demo-mode';

export interface MatchWithAssets {
  id: string;
  date: string;
  opponent: string;
  competition: string;
  notes?: string;
  drive_folder_id?: string;
  assets: Array<{
    id: string;
    type: string;
    status: string;
    assignee?: string;
    deadline?: string;
    priority: string;
  }>;
}

export async function getMatches(): Promise<MatchWithAssets[]> {
  if (!isDemoMode()) {
    // TODO: Fetch from Supabase when demo mode is off
    return [];
  }

  // Demo mode: return mock data
  return mockMatches.map((match) => {
    const assets = mockAssets.filter((asset) => asset.match_id === match.id);
    
    return {
      ...match,
      assets: assets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        status: asset.status,
        assignee: mockUsers.find((u) => u.id === asset.assignee_id)?.name,
        deadline: asset.deadline,
        priority: asset.priority,
      })),
    };
  });
}

export async function getMatch(id: string): Promise<MatchWithAssets | null> {
  const matches = await getMatches();
  return matches.find((m) => m.id === id) || null;
}


