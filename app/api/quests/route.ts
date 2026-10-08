import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse } from '@/lib/api-utils';

export interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  icon: string;
  progress: number;
  total: number;
  xpBonus: number;
  completed: boolean;
}

/**
 * GET /api/quests
 * Retourne les quêtes quotidiennes personnalisées de l'utilisateur connecté
 * avec leur progression réelle depuis user_stats.
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return errorResponse('Non authentifié', 401);
  }

  // 1. Récupérer les stats de l'utilisateur
  const { data: stats, error: statsError } = await auth.supabase
    .from('user_stats')
    .select('total_xp, lessons_completed, quizzes_completed, current_streak, last_activity_date')
    .eq('user_id', auth.userId)
    .single();

  if (statsError || !stats) {
    return errorResponse('Impossible de récupérer vos statistiques.', 500);
  }

  // 2. Nombre de leçons générées aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyUsage } = await auth.supabase
    .from('user_daily_usage')
    .select('lessons_generated')
    .eq('user_id', auth.userId)
    .eq('usage_date', today)
    .single();

  const lessonsToday = dailyUsage?.lessons_generated ?? 0;

  // 3. Nombre de quiz parfaits aujourd'hui (score === total_questions)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: perfectQuizzes } = await auth.supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', auth.userId)
    .gte('created_at', todayStart.toISOString())
    .filter('score', 'eq', 3); // 3/3 = parfait

  const perfectCount = perfectQuizzes?.length ?? 0;

  // 4. Définir les quêtes du jour selon le profil de progression
  const quests: DailyQuest[] = [
    {
      id: 'quest-lesson-today',
      title: '🎯 Explorateur du Jour',
      desc: 'Génère 2 nouvelles leçons aujourd\'hui',
      icon: '📚',
      progress: Math.min(lessonsToday, 2),
      total: 2,
      xpBonus: 50,
      completed: lessonsToday >= 2,
    },
    {
      id: 'quest-perfect-quiz',
      title: '🏆 Maître du Quiz',
      desc: 'Obtiens un score parfait (3/3) à un quiz',
      icon: '🏆',
      progress: Math.min(perfectCount, 1),
      total: 1,
      xpBonus: 80,
      completed: perfectCount >= 1,
    },
    {
      id: 'quest-streak',
      title: '🔥 Série Enflammée',
      desc: `Maintiens ta série active (${stats.current_streak} jour${stats.current_streak > 1 ? 's' : ''})`,
      icon: '🔥',
      progress: Math.min(stats.current_streak, 3),
      total: 3,
      xpBonus: 60,
      completed: stats.current_streak >= 3,
    },
    {
      id: 'quest-xp-today',
      title: '⚡ Accumulateur d\'XP',
      desc: 'Atteins 500 XP au total',
      icon: '⚡',
      progress: Math.min(stats.total_xp, 500),
      total: 500,
      xpBonus: 100,
      completed: stats.total_xp >= 500,
    },
  ];

  // 5. Score global quêtes
  const completedCount = quests.filter((q) => q.completed).length;
  const totalXpAvailable = quests.reduce((sum, q) => sum + q.xpBonus, 0);

  return NextResponse.json({
    quests,
    completedCount,
    totalQuests: quests.length,
    totalXpAvailable,
    date: today,
  });
}
