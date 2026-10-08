import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { calculateXP, computeStreakUpdate, checkAndAwardBadges } from '@/lib/gamification';
import type { QuizQuestion, UserStats } from '@/types/database';

const submitSchema = z.object({
  lessonId: z.string().uuid('lessonId invalide.'),
  answers: z.array(z.number().int().min(0).max(3)).min(1),
});

/**
 * POST /api/quiz/submit
 * Corrige le quiz cote serveur (les bonnes reponses ne quittent jamais le
 * serveur avant cet appel), met a jour XP / streak / compteurs, et attribue
 * les nouveaux badges eventuellement debloques.
 * Body : { lessonId: string, answers: number[] }
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

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Requete invalide.');
  }
  const { lessonId, answers } = parsed.data;

  // 1. Recupere la lecon (et donc les bonnes reponses), verifie l'appartenance.
  const { data: lesson, error: lessonError } = await auth.supabase
    .from('lessons')
    .select('id, quiz')
    .eq('id', lessonId)
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (lessonError) return errorResponse('Impossible de recuperer la lecon.', 500);
  if (!lesson) return errorResponse('Lecon introuvable.', 404);

  const quiz = lesson.quiz as QuizQuestion[];
  if (answers.length !== quiz.length) {
    return errorResponse(`Le quiz attend ${quiz.length} reponses, ${answers.length} recues.`);
  }

  // 2. Correction.
  const correctAnswers = quiz.map((q) => q.correct_index);
  const score = answers.reduce((acc, ans, i) => acc + (ans === correctAnswers[i] ? 1 : 0), 0);
  const total = quiz.length;
  const xpEarned = calculateXP(score, total);
  const isPerfect = score === total;

  // 3. Est-ce la premiere fois que cette lecon est completee ?
  const { count: priorAttempts, error: priorError } = await auth.supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)
    .eq('user_id', auth.userId);

  if (priorError) return errorResponse('Impossible de verifier les tentatives precedentes.', 500);
  const isFirstCompletion = (priorAttempts ?? 0) === 0;

  // 4. Enregistre la tentative.
  const { error: attemptError } = await auth.supabase.from('quiz_attempts').insert({
    lesson_id: lessonId,
    user_id: auth.userId,
    score,
    total_questions: total,
    xp_earned: xpEarned,
  });

  if (attemptError) return errorResponse("Impossible d'enregistrer la tentative de quiz.", 500);

  // 5. Met a jour les stats (XP, streak, compteurs).
  const { data: currentStats, error: statsError } = await auth.supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (statsError) return errorResponse('Impossible de recuperer les statistiques.', 500);

  const baseStats: UserStats =
    currentStats ?? {
      user_id: auth.userId,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      lessons_completed: 0,
      quizzes_completed: 0,
      updated_at: new Date().toISOString(),
    };

  const streakUpdate = computeStreakUpdate(baseStats.last_activity_date, baseStats.current_streak);

  const updatedStats: UserStats = {
    ...baseStats,
    total_xp: baseStats.total_xp + xpEarned,
    current_streak: streakUpdate.current_streak,
    longest_streak: Math.max(baseStats.longest_streak, streakUpdate.current_streak),
    last_activity_date: streakUpdate.last_activity_date,
    lessons_completed: baseStats.lessons_completed + (isFirstCompletion ? 1 : 0),
    quizzes_completed: baseStats.quizzes_completed + 1,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await auth.supabase
    .from('user_stats')
    .upsert(updatedStats, { onConflict: 'user_id' });

  if (upsertError) return errorResponse('Impossible de mettre a jour les statistiques.', 500);

  // 6. Verifie et attribue les nouveaux badges.
  const newBadges = await checkAndAwardBadges(auth.supabase, auth.userId, {
    stats: updatedStats,
    justScoredPerfect: isPerfect,
  });

  return NextResponse.json({
    score,
    total,
    xpEarned,
    isPerfect,
    correctAnswers,
    stats: updatedStats,
    newBadges,
  });
}
