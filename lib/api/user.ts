import { mockAssets, mockMatches } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/demo-mode';

export async function getUserTasks(userId: string) {
  if (!isDemoMode()) {
    // TODO: Fetch from Supabase
    return [];
  }

  // Get all assets assigned to this user
  const userAssets = mockAssets.filter((asset) => asset.assignee_id === userId);

  // Get matches for these assets
  return userAssets.map((asset) => {
    const match = mockMatches.find((m) => m.id === asset.match_id);
    return {
      id: asset.id,
      match: match ? {
        id: match.id,
        opponent: match.opponent,
        date: match.date,
        competition: match.competition,
      } : null,
      type: asset.type,
      status: asset.status,
      deadline: asset.deadline,
      priority: asset.priority,
    };
  });
}


