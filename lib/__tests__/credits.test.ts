import { describe, it, expect } from 'vitest';
import {
  MAX_ADS_PER_DAY,
  CREDITS_PER_AD,
  checkGenerationRights,
  consumeGenerationCredit,
  createAdTicket,
  claimAdTicket,
  startAdWatchSession,
  completeAdWatchSession,
} from '@/lib/credits';
import { FakeStore } from '@/test/utils/supabase-mock';

const USER = 'user-1';

function userCreditsRow(balance = 0) {
  return { user_id: USER, balance };
}

function profileRow(overrides: Record<string, unknown> = {}) {
  return { id: USER, plan: 'gratuit', age_group: 'college_lycee', ...overrides };
}

describe('checkGenerationRights', () => {
  it('autorise les plans premium sans consommation', async () => {
    const store = new FakeStore({ profiles: [profileRow({ plan: 'plus' })] });
    const result = await checkGenerationRights(store as never, USER);
    expect(result.allowed).toBe(true);
    expect(result.isPremium).toBe(true);
  });

  it('autorise si le quota quotidien n est pas epuise', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 3 }],
      user_credits: [userCreditsRow(0)],
    });
    const result = await checkGenerationRights(store as never, USER);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('quota');
    expect(result.freeQuotaLeft).toBe(7);
  });

  it('autorise via les credits bonus quand le quota est epuise', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 10 }],
      user_credits: [userCreditsRow(2)],
    });
    const result = await checkGenerationRights(store as never, USER);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('bonus');
  });

  it('refuse quand quota epuise et aucun credit', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 10 }],
      user_credits: [userCreditsRow(0)],
    });
    const result = await checkGenerationRights(store as never, USER);
    expect(result.allowed).toBe(false);
  });

  it('refuse si le profil est introuvable', async () => {
    const store = new FakeStore({});
    const result = await checkGenerationRights(store as never, USER);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('profile_not_found');
  });
});

describe('consumeGenerationCredit', () => {
  it('ne consomme rien pour les premiums', async () => {
    const store = new FakeStore({ profiles: [profileRow({ plan: 'famille' })] });
    await expect(consumeGenerationCredit(store as never, USER)).resolves.toBeUndefined();
    expect(store.tables.user_daily_usage ?? []).toHaveLength(0);
  });

  it('incremente l usage quotidien pour le plan gratuit (quota)', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 2 }],
      user_credits: [userCreditsRow(0)],
    });
    await consumeGenerationCredit(store as never, USER);
    expect(store.tables.user_daily_usage[0].lessons_generated).toBe(3);
  });

  it('decremente un credit bonus quand le quota est epuise', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 10 }],
      user_credits: [userCreditsRow(3)],
    });
    await consumeGenerationCredit(store as never, USER);
    expect(store.tables.user_credits[0].balance).toBe(2);
  });

  it('rejette sans droits restants', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      user_daily_usage: [{ user_id: USER, usage_date: new Date().toISOString().split('T')[0], lessons_generated: 10 }],
      user_credits: [userCreditsRow(0)],
    });
    await expect(consumeGenerationCredit(store as never, USER)).rejects.toThrow(/No generation rights/);
  });
});

describe('createAdTicket', () => {
  it('refuse pour les comptes enfants', async () => {
    const store = new FakeStore({ profiles: [profileRow({ age_group: 'enfant' })] });
    await expect(createAdTicket(store as never, USER)).rejects.toThrow(/publicit/);
  });

  it('refuse au-dela du plafond quotidien de pubs', async () => {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const claimed = Array.from({ length: MAX_ADS_PER_DAY }, () => ({
      id: `t${Math.random()}`,
      user_id: USER,
      status: 'claimed',
      claimed_at: todayStart.toISOString(),
    }));
    const store = new FakeStore({ profiles: [profileRow()], ad_credit_grants: claimed });
    await expect(createAdTicket(store as never, USER)).rejects.toThrow(/Plafond publicitaire/);
  });

  it('cree un ticket pending', async () => {
    const store = new FakeStore({ profiles: [profileRow()], ad_credit_grants: [] });
    const ticketId = await createAdTicket(store as never, USER);
    expect(ticketId).toBeDefined();
    expect(store.tables.ad_credit_grants[0]).toMatchObject({ user_id: USER, status: 'pending' });
  });
});

describe('claimAdTicket', () => {
  it('refuse un ticket invalide ou deja reclame', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_credit_grants: [{ id: 't1', user_id: USER, status: 'claimed', created_at: new Date().toISOString() }],
    });
    await expect(claimAdTicket(store as never, USER, 't1')).rejects.toThrow(/invalide/);
  });

  it('expire les tickets depasses et refuse', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_credit_grants: [
        { id: 't1', user_id: USER, status: 'pending', created_at: new Date(Date.now() - 3600_000).toISOString(), expires_at: new Date(Date.now() - 1800_000).toISOString() },
      ],
    });
    await expect(claimAdTicket(store as never, USER, 't1')).rejects.toThrow(/expir/);
    expect(store.tables.ad_credit_grants[0].status).toBe('expired');
  });

  it('attribue le credit et marque le ticket comme reclame', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_credit_grants: [
        { id: 't1', user_id: USER, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600_000).toISOString() },
      ],
      user_credits: [userCreditsRow(0)],
    });
    await claimAdTicket(store as never, USER, 't1');
    expect(store.tables.ad_credit_grants[0].status).toBe('claimed');
    expect(store.tables.user_credits[0].balance).toBe(CREDITS_PER_AD);
  });
});

describe('startAdWatchSession', () => {
  it('refuse pour les comptes enfants', async () => {
    const store = new FakeStore({ profiles: [profileRow({ age_group: 'enfant' })] });
    await expect(startAdWatchSession(store as never, USER)).rejects.toThrow(/publicit/);
  });

  it('refuse au-dela du plafond de sessions utilisees', async () => {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const sessions = Array.from({ length: MAX_ADS_PER_DAY }, () => ({
      id: `s${Math.random()}`,
      user_id: USER,
      used: true,
      completed_at: todayStart.toISOString(),
    }));
    const store = new FakeStore({ profiles: [profileRow()], ad_watch_sessions: sessions });
    await expect(startAdWatchSession(store as never, USER)).rejects.toThrow(/Plafond publicitaire/);
  });

  it('cree une session de visionnage', async () => {
    const store = new FakeStore({ profiles: [profileRow()], ad_watch_sessions: [] });
    const sessionId = await startAdWatchSession(store as never, USER);
    expect(sessionId).toBeDefined();
    expect(store.tables.ad_watch_sessions[0]).toMatchObject({ user_id: USER, used: false });
  });
});

describe('completeAdWatchSession', () => {
  it('refuse une session invalide ou deja utilisee', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_watch_sessions: [{ id: 's1', user_id: USER, used: true, started_at: new Date().toISOString() }],
    });
    await expect(completeAdWatchSession(store as never, USER, 's1')).rejects.toThrow(/valider/);
  });

  it('refuse si le temps de visionnage est insuffisant (< 18s)', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_watch_sessions: [{ id: 's1', user_id: USER, used: false, started_at: new Date().toISOString() }],
    });
    await expect(completeAdWatchSession(store as never, USER, 's1')).rejects.toThrow(/insuffisant/);
  });

  it('valide la session et attribue le credit apres 20s', async () => {
    const store = new FakeStore({
      profiles: [profileRow()],
      ad_watch_sessions: [
        { id: 's1', user_id: USER, used: false, started_at: new Date(Date.now() - 20_000).toISOString() },
      ],
      user_credits: [userCreditsRow(0)],
    });
    await completeAdWatchSession(store as never, USER, 's1');
    expect(store.tables.ad_watch_sessions[0].used).toBe(true);
    expect(store.tables.user_credits[0].balance).toBe(CREDITS_PER_AD);
  });
});
