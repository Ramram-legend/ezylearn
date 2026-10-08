import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/server';

/**
 * Recupere l'utilisateur authentifie (via les cookies de session) ainsi
 * qu'un client Supabase pret a l'emploi, deja lie a cet utilisateur.
 * Retourne `null` si personne n'est connecte.
 */
export async function getAuthContext(): Promise<{
  supabase: SupabaseClient;
  userId: string;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return { supabase, userId: user.id };
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorizedResponse = () =>
  errorResponse('Authentification requise. Connecte-toi pour continuer.', 401);
