import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { buildSuggestions } from '@/lib/suggestions';

/**
 * GET /api/dashboard
 * Agrege tout ce dont l'ecran "Tableau de bord" a besoin en un seul appel :
 * stats (XP, streak), profil, lecons recentes, et suggestions personnalisees.
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const [{ data: profile, error: profileError }, { data: stats, error: statsError }, { data: recentLessons, error: lessonsError }] =
    await Promise.all([
      auth.supabase.from('profiles').select('*').eq('id', auth.userId).maybeSingle(),
      auth.supabase.from('user_stats').select('*').eq('user_id', auth.userId).maybeSingle(),
      auth.supabase
        .from('lessons')
        .select('id, topic, subject, created_at')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  if (profileError) return errorResponse('Impossible de recuperer le profil.', 500);
  if (!profile) return errorResponse('Profil introuvable — onboarding requis.', 404);
  if (statsError) return errorResponse('Impossible de recuperer les statistiques.', 500);
  if (lessonsError) return errorResponse('Impossible de recuperer les lecons recentes.', 500);

  const suggestions = buildSuggestions(
    profile.interests ?? [],
    (recentLessons ?? []).map((l: { topic: string }) => l.topic)
  );

  return NextResponse.json({
    profile,
    stats:
      stats ?? {
        user_id: auth.userId,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        lessons_completed: 0,
        quizzes_completed: 0,
        updated_at: new Date().toISOString(),
      },
    recentLessons,
    suggestions,
  });
}
