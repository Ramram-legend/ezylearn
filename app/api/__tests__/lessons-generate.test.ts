import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/lessons/generate/route';
import { getAuthContext } from '@/lib/api-utils';
import { generateLessonContent } from '@/lib/anthropic';
import * as credits from '@/lib/credits';
import { FakeStore } from '@/test/utils/supabase-mock';

vi.mock('@/lib/api-utils', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api-utils')>();
  return { ...mod, getAuthContext: vi.fn() };
});

vi.mock('@/lib/anthropic', () => ({
  generateLessonContent: vi.fn(),
}));

vi.mock('@/lib/credits', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/credits')>();
  return {
    ...mod,
    checkGenerationRights: vi.fn(),
    consumeGenerationCredit: vi.fn(),
  };
});

const USER = 'user-1';

const generatedLesson = {
  content: {
    title: 'La Photosynthese',
    svg: '<svg></svg>',
    explanation: 'Explication',
    fun_fact: 'Fun fact',
    sections: [],
    chapter_index: 1,
    total_chapters: 4,
    is_completed: false,
  },
  quiz: [
    { question: 'Q1', options: ['a', 'b', 'c', 'd'], correct_index: 2 },
    { question: 'Q2', options: ['a', 'b', 'c', 'd'], correct_index: 0 },
    { question: 'Q3', options: ['a', 'b', 'c', 'd'], correct_index: 1 },
  ],
};

function post(body: unknown) {
  return POST(new Request('http://localhost/api/lessons/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('POST /api/lessons/generate', () => {
  beforeEach(() => {
    vi.mocked(getAuthContext).mockReset();
    vi.mocked(generateLessonContent).mockReset();
    vi.mocked(credits.checkGenerationRights).mockReset();
    vi.mocked(credits.consumeGenerationCredit).mockReset();
  });

  it('fonctionne en mode invite sans sauvegarder en base', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    vi.mocked(generateLessonContent).mockResolvedValue(generatedLesson);

    const res = await post({ topic: 'La photosynthese', subject: 'Sciences', level: 'Intermediaire' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lesson.id).toMatch(/^lesson-guest-/);
    expect(body.lesson.content.title).toBe('La Photosynthese');
    expect(body.lesson.quiz).toHaveLength(3);
    // La reponse correcte ne doit jamais fuiter vers le client.
    for (const q of body.lesson.quiz) {
      expect(q).not.toHaveProperty('correct_index');
    }
  });

  it('sauvegarde la lecon et consomme le credit pour un utilisateur connecte', async () => {
    const store = new FakeStore({ lessons: [], user_daily_usage: [], user_credits: [] });
    vi.mocked(getAuthContext).mockResolvedValue({ supabase: store as never, userId: USER });
    vi.mocked(generateLessonContent).mockResolvedValue(generatedLesson);
    vi.mocked(credits.checkGenerationRights).mockResolvedValue({
      allowed: true,
      reason: 'quota',
      isPremium: false,
      freeQuotaLeft: 5,
      bonusCredits: 0,
      ageGroup: 'college_lycee',
    });
    vi.mocked(credits.consumeGenerationCredit).mockResolvedValue(undefined);

    const res = await post({ topic: 'La photosynthese' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(store.tables.lessons).toHaveLength(1);
    expect(store.tables.lessons[0]).toMatchObject({ user_id: USER, topic: 'La photosynthese' });
    expect(body.lesson.id).toBe(store.tables.lessons[0].id);
    expect(credits.consumeGenerationCredit).toHaveBeenCalledTimes(1);
  });

  it('refuse avec 402 si le plafond est atteint', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ supabase: new FakeStore() as never, userId: USER });
    vi.mocked(credits.checkGenerationRights).mockResolvedValue({
      allowed: false,
      reason: 'empty',
      isPremium: false,
      freeQuotaLeft: 0,
      bonusCredits: 0,
      ageGroup: 'college_lycee',
    });

    const res = await post({ topic: 'La photosynthese' });
    expect(res.status).toBe(402);
    expect(generateLessonContent).not.toHaveBeenCalled();
  });

  it('rejette un sujet trop court', async () => {
    const res = await post({ topic: '' });
    expect(res.status).toBe(400);
  });

  it('retourne 502 si la generation IA echoue', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    vi.mocked(generateLessonContent).mockRejectedValue(new Error('API down'));

    const res = await post({ topic: 'La photosynthese' });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('API down');
  });
});
