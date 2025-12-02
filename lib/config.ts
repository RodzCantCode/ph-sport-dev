/**
 * Client-side environment variables configuration
/**
 * Client-side environment variables configuration
 * 
 * Next.js replaces these at build time, so they're safe to use in browser.
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Validar configuración crítica
if (!config.supabase.url || !config.supabase.anonKey) {
  console.error('Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}

export function isSupabaseConfigured(): boolean {
  return !!config.supabase.url && !!config.supabase.anonKey;
}
