// Mock data for demo mode (until Supabase is configured)

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'designer' | 'manager' | 'admin';
  avatar_url?: string;
}

export interface MockMatch {
  id: string;
  date: string;
  opponent: string;
  competition: string;
  drive_folder_id?: string;
  notes?: string;
}

export type MockStatus = 'BACKLOG' | 'IN_PROGRESS' | 'TO_REVIEW' | 'DELIVERED';

export interface MockDesign {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  folder_url?: string;
  deadline_at: string;
  status: MockStatus;
  designer_id?: string;
}

// Mock users
export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'eva@phsport.com',
    name: 'Eva Martinez',
    role: 'manager',
  },
  {
    id: '2',
    email: 'izan@phsport.com',
    name: 'Izan Amez',
    role: 'designer',
  },
  {
    id: '3',
    email: 'luis@phsport.com',
    name: 'Luis',
    role: 'designer',
  },
  {
    id: '4',
    email: 'pau@phsport.com',
    name: 'Pau',
    role: 'designer',
  },
  {
    id: '5',
    email: 'lorenzo@phsport.com',
    name: 'Lorenzo',
    role: 'designer',
  },
];

// Mock matches
export const mockMatches: MockMatch[] = [
  {
    id: '1',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    opponent: 'Real Madrid CF',
    competition: 'La Liga',
    notes: 'Partido de alta visibilidad - Clásico',
    drive_folder_id: 'https://drive.google.com/drive/folders/abc123',
  },
  {
    id: '2',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    opponent: 'Atletico Madrid',
    competition: 'La Liga',
    notes: 'Derbi madrileño',
    drive_folder_id: 'https://drive.google.com/drive/folders/abc124',
  },
  {
    id: '3',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    opponent: 'Sevilla FC',
    competition: 'La Liga',
    drive_folder_id: 'https://drive.google.com/drive/folders/abc125',
  },
];

// Mock assets - Array mutable para DEMO mode (const permite mutación del array)
export const mockDesigns: MockDesign[] = [
  {
    id: 'd1',
    title: 'Matchday Real Madrid',
    player: 'Equipo',
    match_home: 'Real Madrid',
    match_away: 'Barcelona',
    folder_url: 'https://drive.google.com/drive/folders/abc123',
    deadline_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PROGRESS',
    designer_id: '2',
  },
  {
    id: 'd2',
    title: 'Resultado Clásico',
    player: 'Equipo',
    match_home: 'Real Madrid',
    match_away: 'Barcelona',
    deadline_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'BACKLOG',
    designer_id: '3',
  },
  {
    id: 'd3',
    title: 'MVP Clásico',
    player: 'Jugador X',
    match_home: 'Real Madrid',
    match_away: 'Barcelona',
    deadline_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_REVIEW',
    designer_id: '4',
  },
  {
    id: 'd4',
    title: 'Matchday Atlético',
    player: 'Equipo',
    match_home: 'Atlético',
    match_away: 'Sevilla',
    deadline_at: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'BACKLOG',
    designer_id: '5',
  },
  {
    id: 'd5',
    title: 'Resultado Atlético',
    player: 'Equipo',
    match_home: 'Atlético',
    match_away: 'Sevilla',
    deadline_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'BACKLOG',
    designer_id: '2',
  },
];

// Asset types
export const assetTypes = [
  { id: 1, key: 'matchday', label: 'Matchday', default_deadline_offset_hours: 24 },
  { id: 2, key: 'result', label: 'Resultado', default_deadline_offset_hours: 1 },
  { id: 3, key: 'mom', label: 'MVP', default_deadline_offset_hours: 2 },
];

