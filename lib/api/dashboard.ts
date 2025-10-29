import { mockAssets, mockUsers } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/demo-mode';

export interface DashboardStats {
  tasksForToday: number;
  blockedTasks: number;
  reviewTasks: number;
  totalAssets: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isDemoMode()) {
    // TODO: Fetch from Supabase when demo mode is off
    return {
      tasksForToday: 0,
      blockedTasks: 0,
      reviewTasks: 0,
      totalAssets: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksForToday = mockAssets.filter(
    (asset) =>
      asset.deadline &&
      new Date(asset.deadline) >= today &&
      new Date(asset.deadline) < new Date(today.getTime() + 24 * 60 * 60 * 1000)
  ).length;

  const blockedTasks = mockAssets.filter((asset) => asset.status === 'blocked').length;
  const reviewTasks = mockAssets.filter((asset) => asset.status === 'review').length;

  return {
    tasksForToday,
    blockedTasks,
    reviewTasks,
    totalAssets: mockAssets.length,
  };
}

export async function getTeamLoad() {
  if (!isDemoMode()) {
    return [];
  }

  // Calculate load per designer
  return mockUsers
    .filter((user) => user.role === 'designer')
    .map((user) => {
      const assignedAssets = mockAssets.filter((asset) => asset.assignee_id === user.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingTasks = assignedAssets.filter(
        (asset) => asset.deadline && new Date(asset.deadline) > today
      ).length;

      const urgentTasks = assignedAssets.filter(
        (asset) =>
          asset.priority === 'urgent' &&
          asset.status !== 'approved' &&
          asset.status !== 'blocked'
      ).length;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        totalTasks: assignedAssets.length,
        upcomingTasks,
        urgentTasks,
        completedTasks: assignedAssets.filter((a) => a.status === 'approved').length,
      };
    });
}


