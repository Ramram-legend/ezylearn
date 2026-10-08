import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/api-utils';

/**
 * GET /api/interests
 * Retourne le catalogue des centres d'interet (utilise pour l'ecran
 * d'onboarding "Tes centres d'interet"). Public, pas d'authentification requise.
 */
export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('interest_catalog')
    .select('id, label, icon, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return errorResponse("Impossible de recuperer les centres d'interet.", 500);
  }

  return NextResponse.json({ interests: data });
}
