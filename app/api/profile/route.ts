import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { computeAgeGroup } from '@/lib/gamification';

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  age: z.number().int().min(5, 'Age minimum : 5 ans').max(25, 'Age maximum : 25 ans'),
  interests: z
    .array(z.string())
    .min(2, 'Choisis au moins 2 centres d\'interet')
    .max(8, 'Choisis au maximum 8 centres d\'interet'),
});

/**
 * GET /api/profile
 * Retourne le profil de l'utilisateur connecte (404 si l'onboarding n'a pas
 * encore ete complete).
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .maybeSingle();

  if (error) return errorResponse('Impossible de recuperer le profil.', 500);
  if (!data) return errorResponse('Profil introuvable — onboarding requis.', 404);

  return NextResponse.json({ profile: data });
}

/**
 * POST /api/profile
 * Cree ou met a jour le profil (etape d'onboarding : age + centres d'interet).
 * Body : { display_name?: string, age: number, interests: string[] }
 */
export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Corps de requete JSON invalide.');
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Donnees de profil invalides.');
  }

  const { display_name, age, interests } = parsed.data;
  const age_group = computeAgeGroup(age);

  const { data, error } = await auth.supabase
    .from('profiles')
    .upsert(
      {
        id: auth.userId,
        display_name: display_name ?? null,
        age,
        age_group,
        interests,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    return errorResponse(`Impossible d'enregistrer le profil : ${error.message}`, 500);
  }

  // Ensure user_stats has +50 XP onboarding reward
  const { data: existingStats } = await auth.supabase
    .from('user_stats')
    .select('total_xp')
    .eq('user_id', auth.userId)
    .maybeSingle();

  const today = new Date().toISOString().split('T')[0];
  if (!existingStats) {
    await auth.supabase.from('user_stats').insert({
      user_id: auth.userId,
      total_xp: 50,
      current_streak: 1,
      last_activity_date: today,
    });
  } else if (existingStats.total_xp === 150 || existingStats.total_xp === 0) {
    await auth.supabase
      .from('user_stats')
      .update({ total_xp: existingStats.total_xp + 50, updated_at: new Date().toISOString() })
      .eq('user_id', auth.userId);
  }

  return NextResponse.json({ profile: data });
}
