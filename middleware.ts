import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rafraichit la session Supabase (cookies) a chaque requete afin que les
 * routes API recoivent toujours un access token valide. Necessaire car les
 * Route Handlers ne peuvent pas ecrire de cookies "en dehors" d'une reponse.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Important : ne pas retirer cet appel. Il declenche le rafraichissement
  // du token si necessaire et synchronise les cookies de reponse.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Applique le middleware à toutes les routes sauf :
     * - Les fichiers statiques Next.js
     * - Les webhooks Stripe (Q5 : la signature HMAC serait corrompue)
     * - Les routes d'auth Supabase callback (gèrent leurs propres cookies)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
