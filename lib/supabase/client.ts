import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour le navigateur (Client Components).
 * A utiliser depuis le front-end (Next.js pages/composants), pas depuis les routes API.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
