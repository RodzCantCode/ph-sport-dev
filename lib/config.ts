/**
 * Client-side environment variables configuration
 * 
 * Next.js replaces these at build time, so they're safe to use in browser.
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
} as const;

// Helper para debugging
export function isDemoMode(): boolean {
  return config.demoMode;
}

export function isSupabaseConfigured(): boolean {
  return !!config.supabase.url && !!config.supabase.anonKey;
}
