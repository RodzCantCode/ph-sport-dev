// Demo Mode Configuration

// Demo mode: default to true in development if not set
export const DEMO_MODE_ENABLED = 
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'false');

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return DEMO_MODE_ENABLED;
}

/**
 * Get demo mode status message
 */
export function getDemoModeMessage(): string | null {
  if (isDemoMode()) {
    return 'Modo DEMO activo - Usando datos de prueba';
  }
  return null;
}

/**
 * Check if we should use mock data
 */
export function shouldUseMockData(): boolean {
  return DEMO_MODE_ENABLED;
}


