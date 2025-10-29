export type DesignStatus = 'BACKLOG' | 'IN_PROGRESS' | 'TO_REVIEW' | 'DELIVERED';

export interface WeekFilters {
  weekStart: string; // ISO date (YYYY-MM-DD)
  weekEnd: string;   // ISO date (YYYY-MM-DD)
  status?: DesignStatus;
  designerId?: string;
}



