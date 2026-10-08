import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * Déconnecte l'utilisateur et redirige vers la page d'accueil.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/`);
}
