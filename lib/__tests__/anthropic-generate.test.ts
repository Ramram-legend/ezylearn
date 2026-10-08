import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/web-photo', () => ({
  fetchWebPhotosForTopic: vi.fn(),
}));

import { generateLessonContent, generateLessonContinuation } from '@/lib/ai';
import { fetchWebPhotosForTopic } from '@/lib/web-photo';

const mockWebPhoto = fetchWebPhotosForTopic as Mock;
const WEB_PHOTO = {
  web_photo: { url: 'https://images.unsplash.com/photo-1', caption: 'Photo' },
  illustrative_photos: [],
};

const LESSON_JSON = {
  title: 'La Photosynthese',
  svg: '<svg></svg>',
  explanation: 'Explication',
  fun_fact: 'Fun fact',
  previous_summary: 'Resume',
  quiz: [
    { question: 'Q1', options: ['a', 'b', 'c', 'd'], correct_index: 2 },
    { question: 'Q2', options: ['a', 'b', 'c', 'd'], answer: 'b' },
  ],
  sections: [{ heading: 'H', body_markdown: 'M', visualization: null }],
};

function okResponse(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function rateLimitResponse() {
  return new Response(JSON.stringify({ error: 'slow down' }), { status: 429 });
}

beforeEach(() => {
  vi.useRealTimers();
  mockWebPhoto.mockReset().mockResolvedValue(WEB_PHOTO);
  process.env.DEEPSEEK_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.DEEPSEEK_API_KEY;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('generateLessonContent', () => {
  it('genere une lecon complete a partir de la reponse DeepSeek', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(JSON.stringify(LESSON_JSON)));
    vi.stubGlobal('fetch', fetchMock);

    const { content, quiz } = await generateLessonContent({
      topic: 'La photosynthese',
      subject: 'Sciences',
      level: 'Intermediaire',
      age: 14,
      interests: ['nature'],
    });

    expect(content.title).toBe('La Photosynthese');
    expect(content.chapter_index).toBe(1);
    expect(content.total_chapters).toBe(4);
    expect(content.is_completed).toBe(false);
    expect(content.web_photo).toEqual(WEB_PHOTO.web_photo);
    expect(content.sections).toEqual(LESSON_JSON.sections);
    expect(quiz[1]).toMatchObject({ question: 'Q2', correct_index: 1 });
    expect(mockWebPhoto).toHaveBeenCalledWith('La Photosynthese', 'Sciences');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const userPrompt = body.messages[1].content;
    expect(userPrompt).toContain('Sujet: La photosynthese');
    expect(userPrompt).toContain('nature');
  });

  it('retombe sur le sujet demande quand le titre manque', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(JSON.stringify({ quiz: [] }))));
    const { content } = await generateLessonContent({ topic: 'Les atomes' });
    expect(content.title).toBe('Les atomes');
  });

  it('nettrie les injections script et boucles de detection dans le sujet', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(JSON.stringify({ title: 'x', quiz: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await generateLessonContent({ topic: '[ignoring loop detection]<script>alert(1)</script>La photosynthese' });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt = body.messages[1].content as string;
    expect(prompt).toContain('La photosynthese');
    expect(prompt).not.toContain('<script>alert(1)</script>');
    expect(prompt).not.toContain('[ignoring loop detection]');
  });

  it('lève une erreur si la clef API est absente', async () => {
    vi.useFakeTimers();
    delete process.env.DEEPSEEK_API_KEY;
    const promise = generateLessonContent({ topic: 'x' });
    const assertion = expect(promise).rejects.toThrow('DEEPSEEK_API_KEY non configurée');
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
  });

  it('lève une erreur si la reponse ne contient pas de choix', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => okResponse('')));
    const promise = generateLessonContent({ topic: 'x' });
    const assertion = expect(promise).rejects.toThrow(/Réponse vide de DeepSeek/);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
  });
});

describe('generateLessonContent - retries', () => {
  it('repete apres un 429 puis reussit', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResponse())
      .mockResolvedValueOnce(okResponse(JSON.stringify({ title: 'ok', quiz: [] })));
    vi.stubGlobal('fetch', fetchMock);

    const promise = generateLessonContent({ topic: 'x' });
    await vi.advanceTimersByTimeAsync(10000);
    const result = await promise;

    expect(result.content.title).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('abandonne apres 3 tentatives rate-limit', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(rateLimitResponse());
    vi.stubGlobal('fetch', fetchMock);

    const promise = generateLessonContent({ topic: 'x' });
    const assertion = expect(promise).rejects.toThrow('Échec de la génération après 3 tentatives');
    await vi.advanceTimersByTimeAsync(60000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejette avec un message de timeout si DeepSeek depasse 45s', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_res, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));

    const promise = generateLessonContent({ topic: 'x' });
    const assertion = expect(promise).rejects.toThrow(/Timeout/);
    await vi.advanceTimersByTimeAsync(200000);
    await assertion;
  });
});

describe('generateLessonContinuation', () => {
  it('genere le chapitre suivant et marque la fin du parcours', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(JSON.stringify(LESSON_JSON))));

    const { content } = await generateLessonContinuation({
      topic: 'La photosynthese',
      currentChapterIndex: 3,
      totalChapters: 4,
    });

    expect(content.chapter_index).toBe(4);
    expect(content.is_completed).toBe(true);
    expect(content.previous_summary).toBe('Resume');
  });

  it('reste sur un chapitre intermediaire avant la fin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(JSON.stringify({ title: 'c2', quiz: [] }))));

    const { content } = await generateLessonContinuation({
      topic: 'La photosynthese',
      currentChapterIndex: 1,
      totalChapters: 4,
    });

    expect(content.chapter_index).toBe(2);
    expect(content.is_completed).toBe(false);
  });

  it('fournit une synthese par defaut si absente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(JSON.stringify({ title: 'c2', quiz: [] }))));

    const { content } = await generateLessonContinuation({
      topic: 'La photosynthese',
      currentChapterIndex: 1,
    });

    expect(content.previous_summary).toContain('La photosynthese');
  });

  it('abandonne apres 3 tentatives avec le numero de chapitre', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(rateLimitResponse());
    vi.stubGlobal('fetch', fetchMock);

    const promise = generateLessonContinuation({ topic: 'x', currentChapterIndex: 2 });
    const assertion = expect(promise).rejects.toThrow('Échec de la génération du chapitre 3');
    await vi.advanceTimersByTimeAsync(60000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
