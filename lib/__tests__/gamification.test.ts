import { describe, it, expect } from 'vitest';
import {
  computeAgeGroup,
  calculateXP,
  computeStreakUpdate,
  checkAndAwardBadges,
} from '@/lib/gamification';
import { FakeStore } from '@/test/utils/supabase-mock';
import type { Badge, UserStats } from '@/types/database';

describe('computeAgeGroup', () => {
  it('classe les enfants (<= 11 ans)', () => {
    expect(computeAgeGroup(5)).toBe('enfant');
    expect(computeAgeGroup(11)).toBe('enfant');
  });

  it('classe college_lycee (12-17 ans)', () => {
    expect(computeAgeGroup(12)).toBe('college_lycee');
    expect(computeAgeGroup(17)).toBe('college_lycee');
  });

  it('classe etudiant_adulte (>= 18 ans)', () => {
    expect(computeAgeGroup(18)).toBe('etudiant_adulte');
    expect(computeAgeGroup(25)).toBe('etudiant_adulte');
  });
});

describe('calculateXP', () => {
  it('donne 20 XP par bonne reponse sans bonus partiel', () => {
    expect(calculateXP(2, 3)).toBe(40);
  });

  it('ajoute +30 XP de bonus pour un score parfait', () => {
    expect(calculateXP(3, 3)).toBe(90);
  });

  it('retourne 0 pour un score nul', () => {
    expect(calculateXP(0, 3)).toBe(0);
  });
});

describe('computeStreakUpdate', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const longAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);

  it('progresse la streak si la derniere activite date d hier', () => {
    const r = computeStreakUpdate(yesterday, 3);
    expect(r.current_streak).toBe(4);
    expect(r.last_activity_date).toBe(today);
    expect(r.alreadyCountedToday).toBe(false);
  });

  it('ne bouge pas si l activite du jour a deja ete comptabilisee', () => {
    const r = computeStreakUpdate(today, 5);
    expect(r.current_streak).toBe(5);
    expect(r.alreadyCountedToday).toBe(true);
  });

  it('reinitialise a 1 en cas d ecart > 1 jour', () => {
    const r = computeStreakUpdate(longAgo, 7);
    expect(r.current_streak).toBe(1);
  });

  it('initialise a 1 sans activite precedente', () => {
    const r = computeStreakUpdate(null, 0);
    expect(r.current_streak).toBe(1);
  });
});

describe('checkAndAwardBadges', () => {
  const badges: Badge[] = [
    { id: 'b1', code: 'first_lesson', label: 'Premiere Lecon', icon: '📖', description: '', condition_type: 'lessons_count', condition_value: 1 },
    { id: 'b2', code: 'streak_3', label: 'Serie 3', icon: '🔥', description: '', condition_type: 'streak', condition_value: 3 },
    { id: 'b3', code: 'perfect_score', label: 'Parfait', icon: '🏆', description: '', condition_type: 'perfect_score', condition_value: 1 },
    { id: 'b4', code: 'lessons_10', label: '10 Lecons', icon: '📚', description: '', condition_type: 'lessons_count', condition_value: 10 },
  ];

  const baseStats: UserStats = {
    user_id: 'u1',
    total_xp: 200,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: new Date().toISOString(),
    lessons_completed: 1,
    quizzes_completed: 1,
    updated_at: new Date().toISOString(),
  };

  it("attribue les badges meritables et pas les autres", async () => {
    const store = new FakeStore({
      badges: badges.map((b) => ({ ...b })),
      user_badges: [],
    });
    const supabase = store as unknown as Parameters<typeof checkAndAwardBadges>[0];

    const newlyEarned = await checkAndAwardBadges(supabase, 'u1', {
      stats: { ...baseStats, lessons_completed: 1, current_streak: 1 },
      justScoredPerfect: false,
    });

    expect(newlyEarned.map((b) => b.code).sort()).toEqual(['first_lesson']);
    expect(store.tables.user_badges).toHaveLength(1);
  });

  it('est idempotent : ne reattribue jamais un badge deja gagne', async () => {
    const store = new FakeStore({
      badges: badges.map((b) => ({ ...b })),
      user_badges: [{ user_id: 'u1', badge_id: 'b1' }],
    });
    const supabase = store as unknown as Parameters<typeof checkAndAwardBadges>[0];

    const newlyEarned = await checkAndAwardBadges(supabase, 'u1', {
      stats: { ...baseStats, lessons_completed: 1 },
      justScoredPerfect: false,
    });

    expect(newlyEarned).toHaveLength(0);
    expect(store.tables.user_badges).toHaveLength(1);
  });

  it('attribue le badge parfait uniquement en cas de score parfait', async () => {
    const store = new FakeStore({
      badges: badges.map((b) => ({ ...b })),
      user_badges: [],
    });
    const supabase = store as unknown as Parameters<typeof checkAndAwardBadges>[0];

    const newlyEarned = await checkAndAwardBadges(supabase, 'u1', {
      stats: { ...baseStats, lessons_completed: 10, current_streak: 4 },
      justScoredPerfect: true,
    });

    expect(newlyEarned.map((b) => b.code).sort()).toEqual([
      'first_lesson',
      'lessons_10',
      'perfect_score',
      'streak_3',
    ]);
  });

  it('retourne [] si le catalogue de badges est inaccessible', async () => {
    const store = new FakeStore({ user_badges: [] });
    store.from('badges').select('*').then = undefined as never;
    const supabase = {
      ...store,
      from: () => ({
        select: () => ({ then: undefined, eq: () => ({ then: undefined }) }),
      }),
    };
    const result = await checkAndAwardBadges(supabase as never, 'u1', {
      stats: baseStats,
      justScoredPerfect: false,
    });
    expect(result).toEqual([]);
  });
});
