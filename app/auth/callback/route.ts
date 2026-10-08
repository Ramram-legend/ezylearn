import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * GET /auth/callback
 * Supabase redirige ici après la validation du magic link.
 * Echange le code PKCE contre une session, crée le profil si c'est
 * un nouvel utilisateur, puis redirige vers le tableau de bord.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message);
    return NextResponse.redirect(`${origin}/?auth_error=1`);
  }

  const user = data.user;

  // Retrieve the display_name stored transiently during login
  const pendingName = request.cookies.get('easylearn_pending_name')?.value ?? '';

  // Check if profile already exists and has age + preferences configured
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, age, interests')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile || !existingProfile.interests || existingProfile.interests.length < 2) {
    if (!existingProfile) {
      // First login: create a stub profile using the name provided at login
      const displayName =
        pendingName ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        'Apprenant';

      await supabase.from('profiles').insert({
        id: user.id,
        display_name: displayName,
        age: 14,
        age_group: 'college_lycee',
        interests: [],
      });
    }

    // Clear the pending name cookie
    response.cookies.set('easylearn_pending_name', '', { maxAge: 0 });

    // User must configure age & preferences (Step 2: onboarding)
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Returning user — clear cookie just in case
  response.cookies.set('easylearn_pending_name', '', { maxAge: 0 });

  return response;
}
