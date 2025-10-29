export type UserRole = 'designer' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  date: string;
  opponent: string;
  competition: string;
  drive_folder_id?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface AssetType {
  id: number;
  key: string;
  label: string;
  default_deadline_offset_hours: number;
}

export type AssetStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'blocked';
export type AssetPriority = 'normal' | 'urgent';

export interface Asset {
  id: string;
  match_id: string;
  type_id: number;
  assignee_id?: string | null;
  status: AssetStatus;
  deadline?: string | null;
  drive_folder_id?: string | null;
  drive_file_url?: string | null;
  blocked_reason?: string | null;
  preview_url?: string | null;
  priority: AssetPriority;
  created_at: string;
  updated_at?: string | null;
}

export interface Approval {
  id: string;
  asset_id: string;
  reviewer_id: string;
  decision: 'approved' | 'rejected';
  comment?: string | null;
  decided_at: string;
}

export interface EventLog {
  id: number;
  entity: 'asset' | 'match' | 'approval';
  entity_id: string;
  action: string;
  by_user: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
}



