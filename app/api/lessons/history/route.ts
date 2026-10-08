import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

/**
 * GET /api/lessons/history?limit=20
 * Historique des lecons de l'utilisateur (les plus recentes d'abord),
 * utilise pour le tableau de bord ("Lecons vues") et pour eviter de
 * resuggerer des sujets deja traites.
 */
export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  const { data, error } = await auth.supabase
    .from('lessons')
    .select('id, topic, subject, level, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return errorResponse("Impossible de recuperer l'historique des lecons.", 500);

  return NextResponse.json({ lessons: data, count: data.length });
}
