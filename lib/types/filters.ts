export type DesignStatus = 'BACKLOG' | 'DELIVERED';

export interface WeekFilters {
  weekStart: string; // ISO date (YYYY-MM-DD)
  weekEnd: string;   // ISO date (YYYY-MM-DD)
  status?: DesignStatus;
  designerId?: string;
}

