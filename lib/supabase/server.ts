import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Client Supabase cote serveur (Route Handlers, Server Components).
 * Lit/ecrit les cookies de session pour maintenir l'utilisateur authentifie.
 * Respecte les policies RLS : chaque requete agit avec les droits de
 * l'utilisateur connecte (via son JWT), jamais avec des droits admin.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore : appele depuis un Server Component, le rafraichissement
            // de session est de toute facon gere par le middleware.
          }
        },
      },
    }
  );
}
