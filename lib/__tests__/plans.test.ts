import { describe, it, expect } from 'vitest';
import { getDailyLimit, hasReachedDailyLimit, DAILY_GENERATION_LIMITS } from '@/lib/plans';

describe('getDailyLimit', () => {
  it('retourne la limite du plan gratuit', () => {
    expect(getDailyLimit('gratuit')).toBe(10);
  });

  it('retourne null pour les plans illimites', () => {
    expect(getDailyLimit('plus')).toBeNull();
    expect(getDailyLimit('famille')).toBeNull();
    expect(getDailyLimit('etablissement')).toBeNull();
  });

  it('retombe sur le plan gratuit pour un plan inconnu', () => {
    expect(getDailyLimit('inconnu' as never)).toBe(DAILY_GENERATION_LIMITS.gratuit);
  });
});

describe('hasReachedDailyLimit', () => {
  it('atteint la limite exacte', () => {
    expect(hasReachedDailyLimit('gratuit', 10)).toBe(true);
  });

  it('depasse la limite', () => {
    expect(hasReachedDailyLimit('gratuit', 12)).toBe(true);
  });

  it('ne bloque pas sous la limite', () => {
    expect(hasReachedDailyLimit('gratuit', 9)).toBe(false);
  });

  it('ne bloque jamais un plan illimite', () => {
    expect(hasReachedDailyLimit('plus', 999)).toBe(false);
  });
});
