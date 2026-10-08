import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgeGroup, Badge, UserStats } from '@/types/database';

/** Traduit un age en groupe d'age, utilise pour adapter le contenu genere. */
export function computeAgeGroup(age: number): AgeGroup {
  if (age <= 11) return 'enfant';
  if (age <= 17) return 'college_lycee';
  return 'etudiant_adulte';
}

/**
 * Calcule l'XP gagne pour un quiz, en reprenant la logique du prototype
 * (easylearn_v2.html / renderResults) : 20 XP par bonne reponse, +30 XP
 * bonus en cas de score parfait.
 */
export function calculateXP(score: number, total: number): number {
  const base = score * 20;
  const bonus = total > 0 && score === total ? 30 : 0;
  return base + bonus;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface StreakUpdate {
  current_streak: number;
  last_activity_date: string;
  /** true si la streak avait deja ete mise a jour aujourd'hui (pas de double comptage) */
  alreadyCountedToday: boolean;
}

/**
 * Determine la nouvelle streak de l'utilisateur en fonction de la date de
 * derniere activite. Une streak progresse si la derniere activite datait
 * d'hier, se reinitialise a 1 en cas d'ecart, et ne bouge pas si l'activite
 * du jour a deja ete comptabilisee.
 */
export function computeStreakUpdate(
  lastActivityDate: string | null,
  currentStreak: number
): StreakUpdate {
  const today = todayISODate();

  if (lastActivityDate === today) {
    return { current_streak: currentStreak, last_activity_date: today, alreadyCountedToday: true };
  }

  if (!lastActivityDate) {
    return { current_streak: 1, last_activity_date: today, alreadyCountedToday: false };
  }

  const diffDays = Math.round(
    (new Date(today).getTime() - new Date(lastActivityDate).getTime()) / 86_400_000
  );

  if (diffDays === 1) {
    return { current_streak: currentStreak + 1, last_activity_date: today, alreadyCountedToday: false };
  }

  return { current_streak: 1, last_activity_date: today, alreadyCountedToday: false };
}

/**
 * Verifie le catalogue de badges par rapport aux stats actuelles de
 * l'utilisateur, attribue les nouveaux badges merites et les retourne.
 * Idempotent : n'attribue jamais deux fois le meme badge.
 */
export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
  params: { stats: UserStats; justScoredPerfect: boolean }
): Promise<Badge[]> {
  const { data: allBadges, error: badgesError } = await supabase
    .from('badges')
    .select('*');

  if (badgesError || !allBadges) return [];

  const { data: earnedRows } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earnedRows ?? []).map((row: { badge_id: string }) => row.badge_id));

  const newlyEarned = (allBadges as Badge[]).filter((badge) => {
    if (earnedIds.has(badge.id)) return false;

    switch (badge.condition_type) {
      case 'lessons_count':
        return params.stats.lessons_completed >= badge.condition_value;
      case 'perfect_score':
        return params.justScoredPerfect;
      case 'streak':
        return params.stats.current_streak >= badge.condition_value;
      default:
        return false;
    }
  });

  if (newlyEarned.length > 0) {
    await supabase.from('user_badges').insert(
      newlyEarned.map((badge) => ({ user_id: userId, badge_id: badge.id }))
    );
  }

  return newlyEarned;
}
