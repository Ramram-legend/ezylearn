import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  display_name: z.string().trim().min(1, 'Le prénom est requis.').max(80),
});

/**
 * POST /api/auth/login
 * Envoie un magic link Supabase à l'email fourni.
 * Stocke le display_name dans un cookie court pour que /auth/callback puisse
 * l'utiliser lors de la création du profil.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const { email, display_name } = parsed.data;
  const supabase = createClient();

  // Prefer the explicitly set site URL (from Vercel env vars) to avoid
  // magic links pointing to localhost when running behind Vercel's edge.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const redirectTo = `${siteUrl}/auth/callback`;
  console.log('[api/auth/login] emailRedirectTo:', redirectTo);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('[api/auth/login] signInWithOtp error:', error.message, error.status);
    // Surface the real error so the user can debug (e.g. "Invalid redirect URL" means
    // the callback URL must be added to Supabase → Auth → URL Configuration → Redirect URLs)
    return NextResponse.json(
      { error: error.message },
      { status: error.status ?? 500 }
    );
  }

  // Store the display name transiently so the callback can pick it up
  const res = NextResponse.json({ success: true });
  res.cookies.set('easylearn_pending_name', display_name, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 30, // 30 minutes
    path: '/',
  });

  return res;
}
