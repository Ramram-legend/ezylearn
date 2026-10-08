import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

/**
 * GET /api/badges
 * Retourne le catalogue complet des badges, chacun annote de son statut
 * pour l'utilisateur connecte (obtenu ou non, et a quelle date).
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const [{ data: allBadges, error: badgesError }, { data: earned, error: earnedError }] = await Promise.all([
    auth.supabase.from('badges').select('*'),
    auth.supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', auth.userId),
  ]);

  if (badgesError) return errorResponse('Impossible de recuperer les badges.', 500);
  if (earnedError) return errorResponse('Impossible de recuperer les badges obtenus.', 500);

  const earnedMap = new Map(
    (earned ?? []).map((row: { badge_id: string; earned_at: string }) => [row.badge_id, row.earned_at])
  );

  const badges = (allBadges ?? []).map((badge: { id: string }) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earned_at: earnedMap.get(badge.id) ?? null,
  }));

  return NextResponse.json({ badges });
}
