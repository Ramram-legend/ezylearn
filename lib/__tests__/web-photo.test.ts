import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWebPhotosForTopic } from '@/lib/web-photo';

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function wikiSummary(title: string, imgUrl?: string, description?: string) {
  return ok({
    title,
    description,
    extract: 'Extrait de l article.',
    originalimage: imgUrl ? { source: imgUrl } : undefined,
    thumbnail: imgUrl ? { source: imgUrl } : undefined,
  });
}

function frSummary(body: unknown) {
  return {
    fr_summary: () => ok(body),
    fr_search: () => ok({ query: { search: [] } }),
    en_summary: () => ok(body),
    hit_summary: () => null as unknown,
  };
}

type FetchRouter = Record<string, () => unknown>;

function mockFetch(router: FetchRouter) {
  const fn = vi.fn(async (url: string) => {
    for (const [key, handler] of Object.entries(router)) {
      if (url.includes(key)) return handler();
    }
    throw new Error(`URL non geree par le mock: ${url}`);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWebPhotosForTopic', () => {
  it('retourne une photo de secours sans appel reseau si le sujet est vide', async () => {
    const fn = vi.fn();
    vi.stubGlobal('fetch', fn);

    const result = await fetchWebPhotosForTopic('');
    expect(fn).not.toHaveBeenCalled();
    expect(result.web_photo.source).toBe('Banque d\'images de référence');
  });

  it('nettoie le sujet (article + sous-titre) pour la recherche', async () => {
    const fn = mockFetch({ 'fr.wikipedia.org': () => frSummary(wikiSummary('Photosynthèse', 'https://ex.com/a.png')).fr_summary() });

    await fetchWebPhotosForTopic('La Photosynthèse : le processus complet');

    const firstUrl = fn.mock.calls[0][0] as string;
    expect(firstUrl).toContain('/page/summary/Photosynth%C3%A8se');
  });

  it('agrege les photos, deduplique et convertit http en https', async () => {
    const fn = mockFetch({
      'rest_v1/page/summary/Photosynth': () => wikiSummary('Photosynthèse', 'http://ex.com/main.png'),
      'w/api.php': () => ok({ query: { search: [{ title: 'Chlorophylle' }, { title: 'Feuille' }, { title: 'Plante' }] } }),
      '/page/summary/Chlorophylle': () => wikiSummary('Chlorophylle', 'https://ex.com/symbol_leaf.png'),
      '/page/summary/Feuille': () => wikiSummary('Feuille', 'https://ex.com/flag_fr.png'),
      '/page/summary/Plante': () => wikiSummary('Plante', 'https://ex.com/plant.png', 'desc'),
    });

    const result = await fetchWebPhotosForTopic('Photosynthèse');

    expect(result.web_photo.url).toBe('https://ex.com/main.png');
    expect(fn).toHaveBeenCalled();
    const allUrls = [result.web_photo.url, ...result.illustrative_photos.map((p) => p.url)];
    expect(allUrls.some((u) => u.startsWith('http://'))).toBe(false);
    expect(allUrls.some((u) => u.includes('symbol_') || u.includes('flag_'))).toBe(false);
  });

  it('complete les illustrations avec les photos de secours si necessaire', async () => {
    mockFetch({
      'fr.wikipedia.org/api/rest_v1/page/summary/cellule': () => wikiSummary('Cellule', 'https://ex.com/cell.png'),
      'w/api.php': () => ok({ query: { search: [] } }),
    });

    const result = await fetchWebPhotosForTopic('La cellule et l ATP');

    expect(result.web_photo.url).toBe('https://ex.com/cell.png');
    expect(result.illustrative_photos.length).toBeGreaterThanOrEqual(2);
  });

  it('interroge Wikipedia EN si moins de 3 photos trouvees en FR', async () => {
    mockFetch({
      'fr.wikipedia.org/api/rest_v1/page/summary/Mars': () => wikiSummary('Mars', 'https://ex.com/mars.png'),
      'w/api.php': () => ok({ query: { search: [] } }),
      'en.wikipedia.org/api/rest_v1/page/summary/Mars': () => wikiSummary('Mars', 'https://ex.com/mars-en.png'),
    });

    const result = await fetchWebPhotosForTopic('Mars');
    expect(result.illustrative_photos.length).toBeGreaterThanOrEqual(1);
  });

  it('retombe sur les photos de secours si aucune photo n est trouvee', async () => {
    mockFetch({
      'fr.wikipedia.org/api/rest_v1/page/summary/fractions': () => wikiSummary('Fractions'),
      'w/api.php': () => ok({ query: { search: [] } }),
    });

    const result = await fetchWebPhotosForTopic('Les fractions');
    expect(result.web_photo.source).toBe('Banque d\'images de référence');
  });

  it('tolere les pannes reseau et retombe sur les photos de secours', async () => {
    mockFetch({
      'fr.wikipedia.org': () => {
        throw new Error('network down');
      },
      'w/api.php': () => {
        throw new Error('network down');
      },
    });

    const result = await fetchWebPhotosForTopic('La gravite');
    expect(result.web_photo.url).toContain('unsplash.com');
  });
});
