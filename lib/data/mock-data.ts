// Mock data for demo mode (hasta integrar Supabase)

import type { Design } from '@/lib/types/design';

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

export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'eva@phsport.com',
    name: 'Eva Alcázar',
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

export const mockDesigns: Design[] = [
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
    player_status: 'injured',
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
  {
    id: 'd6',
    title: 'Matchday Valencia',
    player: 'Equipo',
    match_home: 'Valencia',
    match_away: 'Real Betis',
    folder_url: 'https://drive.google.com/drive/folders/abc126',
    deadline_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PROGRESS',
    designer_id: '3',
  },
  {
    id: 'd7',
    title: 'MVP Vinicius Jr',
    player: 'Vinicius Jr',
    match_home: 'Real Madrid',
    match_away: 'Barcelona',
    folder_url: 'https://drive.google.com/drive/folders/abc127',
    deadline_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_REVIEW',
    player_status: 'suspended',
    designer_id: '2',
  },
  {
    id: 'd8',
    title: 'Resultado Villarreal',
    player: 'Equipo',
    match_home: 'Villarreal',
    match_away: 'Athletic Bilbao',
    deadline_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'BACKLOG',
    designer_id: '4',
  },
  {
    id: 'd9',
    title: 'Matchday Getafe',
    player: 'Equipo',
    match_home: 'Getafe',
    match_away: 'Real Sociedad',
    folder_url: 'https://drive.google.com/drive/folders/abc128',
    deadline_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'DELIVERED',
    player_status: 'last_minute',
    designer_id: '5',
  },
  {
    id: 'd10',
    title: 'MVP Griezmann',
    player: 'Antoine Griezmann',
    match_home: 'Atlético',
    match_away: 'Sevilla',
    deadline_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'BACKLOG',
    player_status: 'doubt',
    designer_id: '3',
  },
];

export const assetTypes = [
  { id: 1, key: 'matchday', label: 'Matchday', default_deadline_offset_hours: 24 },
  { id: 2, key: 'result', label: 'Resultado', default_deadline_offset_hours: 1 },
  { id: 3, key: 'mom', label: 'MVP', default_deadline_offset_hours: 2 },
];

export function getDesigners() {
  return mockUsers.filter(u => u.role === 'designer');
}

export function getDesignerById(designerId?: string) {
  return designerId ? mockUsers.find(u => u.id === designerId) : null;
}

