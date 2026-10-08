import type { Plan } from '@/types/database';

/**
 * Limites de generations IA par jour, selon le modele economique du CDC
 * (section "Modele economique"). `null` = illimite.
 */
export const DAILY_GENERATION_LIMITS: Record<Plan, number | null> = {
  gratuit: 10,
  plus: null,
  famille: null,
  etablissement: null,
};

export function getDailyLimit(plan: Plan): number | null {
  return plan in DAILY_GENERATION_LIMITS ? DAILY_GENERATION_LIMITS[plan] : DAILY_GENERATION_LIMITS.gratuit;
}

export function hasReachedDailyLimit(plan: Plan, generationsToday: number): boolean {
  const limit = getDailyLimit(plan);
  if (limit === null) return false;
  return generationsToday >= limit;
}
