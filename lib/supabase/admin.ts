import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase "admin" utilisant la SERVICE_ROLE_KEY : contourne les
 * policies RLS. A n'utiliser QUE dans du code serveur de confiance (jamais
 * expose au client, jamais importe dans un composant React).
 *
 * Les routes serveur peuvent l'utiliser pour les mutations autorisées après
 * avoir vérifié l'identité et limité chaque opération à l'utilisateur concerné.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante : requise pour createAdminClient().'
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
