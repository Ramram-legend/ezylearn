import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase "admin" utilisant la SERVICE_ROLE_KEY : contourne les
 * policies RLS. A n'utiliser QUE dans du code serveur de confiance (jamais
 * expose au client, jamais importe dans un composant React).
 *
 * Dans ce backend, les policies RLS sont concues pour que la quasi-totalite
 * des operations passent par le client "utilisateur" standard
 * (lib/supabase/server.ts). Ce client admin est fourni pour les futures
 * taches d'administration (ex: tableau de bord etablissement, taches cron
 * de maintenance des streaks) qui doivent agir en dehors du contexte d'un
 * utilisateur precis.
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
