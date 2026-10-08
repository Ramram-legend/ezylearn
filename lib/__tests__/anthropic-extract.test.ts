import { describe, it, expect } from 'vitest';
import { extractJson } from '@/lib/ai';

describe('extractJson', () => {
  it('parse un objet JSON valide', () => {
    expect(extractJson('{"title":"La Photosynthese","quiz":[]}')).toEqual({
      title: 'La Photosynthese',
      quiz: [],
    });
  });

  it('extrait le JSON englobe dans des fences markdown', () => {
    const raw = '```json\n{"title":"L Eau","correct_index":1}\n```';
    expect(extractJson(raw)).toEqual({ title: 'L Eau', correct_index: 1 });
  });

  it('ignore le texte avant et apres le premier objet', () => {
    const raw = 'Voici la lecon :\n{"a":1}\nFin du message.';
    expect(extractJson(raw)).toEqual({ a: 1 });
  });

  it('sanitise les retours a la ligne bruts dans les chaines', () => {
    const raw = '{"svg":"<svg\\nviewBox=\\"0 0 800 450\\">\\n</svg>","title":"x"}';
    expect(extractJson(raw).title).toBe('x');
  });

  it('tolere les virgules finales avant une accolade', () => {
    const raw = '{"list":[1,2,],"x":1,}';
    expect(extractJson(raw)).toEqual({ list: [1, 2], x: 1 });
  });

  it('remonte l erreur sur un JSON non recuperable', () => {
    expect(() => extractJson('pas de json ici')).toThrow();
  });
});
