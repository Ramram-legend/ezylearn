import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/quiz/submit/route';
import { getAuthContext } from '@/lib/api-utils';
import { FakeStore } from '@/test/utils/supabase-mock';

vi.mock('@/lib/api-utils', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api-utils')>();
  return { ...mod, getAuthContext: vi.fn() };
});

const USER = 'user-1';
const LESSON_ID = '11111111-1111-1111-1111-111111111111';

function lessonRow(quiz: unknown) {
  return {
    id: LESSON_ID,
    user_id: USER,
    topic: 'La Photosynthese',
    subject: 'Sciences',
    level: 'Intermediaire',
    content: { title: 'La Photosynthese' },
    quiz,
    created_at: new Date().toISOString(),
  };
}

function jsonResponse(res: Response) {
  return res.json();
}

describe('POST /api/quiz/submit', () => {
  beforeEach(() => {
    vi.mocked(getAuthContext).mockReset();
  });

  it('retourne 401 sans session', async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: LESSON_ID, answers: [0, 0, 0] }),
    }));
    expect(res.status).toBe(401);
  });

  it('rejette un corps invalide', async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ supabase: new FakeStore() as never, userId: USER });
    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: 'pas-un-uuid', answers: [] }),
    }));
    expect(res.status).toBe(400);
  });

  it('corrige le quiz, calcule XP et met a jour les stats', async () => {
    const quiz = [
      { question: 'Q1', options: ['a', 'b', 'c', 'd'], correct_index: 1 },
      { question: 'Q2', options: ['a', 'b', 'c', 'd'], correct_index: 2 },
      { question: 'Q3', options: ['a', 'b', 'c', 'd'], correct_index: 0 },
    ];
    const store = new FakeStore({
      lessons: [lessonRow(quiz)],
      quiz_attempts: [],
      user_stats: [{ user_id: USER, total_xp: 100, current_streak: 1, longest_streak: 1, last_activity_date: null, lessons_completed: 0, quizzes_completed: 0, updated_at: new Date().toISOString() }],
      badges: [],
      user_badges: [],
    });

    vi.mocked(getAuthContext).mockResolvedValue({ supabase: store as never, userId: USER });

    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: LESSON_ID, answers: [1, 2, 0] }),
    }));

    expect(res.status).toBe(200);
    const body = await jsonResponse(res);
    expect(body.score).toBe(3);
    expect(body.total).toBe(3);
    expect(body.xpEarned).toBe(90);
    expect(body.isPerfect).toBe(true);
    expect(body.correctAnswers).toEqual([1, 2, 0]);
    expect(body.stats.total_xp).toBe(190);
    expect(body.stats.lessons_completed).toBe(1);
    expect(body.stats.quizzes_completed).toBe(1);
    expect(store.tables.quiz_attempts).toHaveLength(1);
  });

  it("ne compte pas deux fois une lecon deja terminee", async () => {
    const quiz = [
      { question: 'Q1', options: ['a', 'b', 'c', 'd'], correct_index: 0 },
    ];
    const store = new FakeStore({
      lessons: [lessonRow(quiz)],
      quiz_attempts: [
        { id: 'a1', lesson_id: LESSON_ID, user_id: USER, score: 1, total_questions: 1, xp_earned: 20, created_at: new Date().toISOString() },
      ],
      user_stats: [{ user_id: USER, total_xp: 200, current_streak: 2, longest_streak: 2, last_activity_date: new Date().toISOString().split('T')[0], lessons_completed: 1, quizzes_completed: 1, updated_at: new Date().toISOString() }],
      badges: [],
      user_badges: [],
    });

    vi.mocked(getAuthContext).mockResolvedValue({ supabase: store as never, userId: USER });

    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: LESSON_ID, answers: [0] }),
    }));

    const body = await jsonResponse(res);
    expect(body.stats.lessons_completed).toBe(1);
    expect(body.stats.quizzes_completed).toBe(2);
  });

  it('retourne 404 pour une lecon introuvable', async () => {
    const store = new FakeStore({ lessons: [] });
    vi.mocked(getAuthContext).mockResolvedValue({ supabase: store as never, userId: USER });
    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: LESSON_ID, answers: [0] }),
    }));
    expect(res.status).toBe(404);
  });

  it('rejette un nombre de reponses different de la taille du quiz', async () => {
    const quiz = [
      { question: 'Q1', options: ['a', 'b', 'c', 'd'], correct_index: 0 },
      { question: 'Q2', options: ['a', 'b', 'c', 'd'], correct_index: 1 },
    ];
    const store = new FakeStore({ lessons: [lessonRow(quiz)] });
    vi.mocked(getAuthContext).mockResolvedValue({ supabase: store as never, userId: USER });
    const res = await POST(new Request('http://localhost/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ lessonId: LESSON_ID, answers: [0] }),
    }));
    expect(res.status).toBe(400);
  });
});
