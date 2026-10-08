import { describe, it, expect } from 'vitest';
import { buildSuggestions } from '@/lib/suggestions';

describe('buildSuggestions', () => {
  it('deduit les sujets depuis les centres d interet', () => {
    const suggestions = buildSuggestions(['football', 'space'], []);
    expect(suggestions).toEqual(['Les lois du mouvement de Newton', 'La trajectoire d\'un ballon', 'Le systeme solaire']);
  });

  it('complete avec les suggestions par defaut quand il manque des sujets', () => {
    const suggestions = buildSuggestions([], [], 2);
    expect(suggestions).toEqual(['La photosynthese', 'La gravite']);
  });

  it('est insensible a la casse des centres d interet', () => {
    const suggestions = buildSuggestions(['SPACE', 'Music'], []);
    expect(suggestions[0]).toBe('Le systeme solaire');
  });

  it('ignore les sujets deja recents', () => {
    const suggestions = buildSuggestions(['football'], ['Les lois du mouvement de Newton'], 2);
    expect(suggestions).not.toContain('Les lois du mouvement de Newton');
    expect(suggestions).toHaveLength(2);
  });

  it('respecte la limite demandee', () => {
    const suggestions = buildSuggestions(['space', 'nature', 'music', 'gaming'], [], 5);
    expect(suggestions).toHaveLength(5);
  });

  it('ne depasse jamais la limite meme si count est grand', () => {
    const suggestions = buildSuggestions([], [], 100);
    expect(suggestions.length).toBeLessThanOrEqual(100);
    expect(suggestions).toContain('La photosynthese');
  });

  it('retourne une liste vide pour count zero', () => {
    expect(buildSuggestions(['space'], [], 0)).toEqual([]);
  });
});
