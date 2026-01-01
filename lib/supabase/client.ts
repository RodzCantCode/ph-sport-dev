import { createBrowserClient } from '@supabase/ssr';
import { config } from '@/lib/config';

// Singleton pattern - reuse the same client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }
  return supabaseClient;
}
