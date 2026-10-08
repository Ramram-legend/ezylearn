/**
 * Suggestions de sujets de lecon en fonction des centres d'interet de
 * l'apprenant. Volontairement statique et simple pour ce MVP ; pourrait
 * plus tard etre remplace par un appel a Claude pour des suggestions
 * entierement dynamiques.
 */
const INTEREST_TOPIC_MAP: Record<string, string[]> = {
  football: ['Les lois du mouvement de Newton', "La trajectoire d'un ballon"],
  sports: ['Les lois du mouvement de Newton', "Le corps humain a l'effort"],
  gaming: ['Comment fonctionne un ordinateur', 'Les algorithmes'],
  tech: ['Comment fonctionne un ordinateur', "L'intelligence artificielle"],
  music: ['Les ondes sonores', "Comment fonctionne l'oreille"],
  space: ['Le systeme solaire', 'La gravite'],
  animals: ['La chaine alimentaire', 'Les especes'],
  nature: ["Le cycle de l'eau", 'La photosynthese'],
  cooking: ['Les reactions chimiques en cuisine', 'Les etats de la matiere'],
  cinema: ['La persistance retinienne', 'La lumiere et les couleurs'],
  science: ['La photosynthese', 'Les atomes et molecules'],
  arts: ['Les couleurs et la lumiere', 'La perspective en dessin'],
};

const DEFAULT_SUGGESTIONS = ['La photosynthese', 'La gravite', 'Les fractions'];

export function buildSuggestions(
  interests: string[],
  recentTopics: string[],
  count = 3
): string[] {
  const recentSet = new Set(recentTopics.map((t) => t.toLowerCase()));
  const candidates: string[] = [];

  for (const interest of interests) {
    const topics = INTEREST_TOPIC_MAP[interest.toLowerCase()];
    if (topics) candidates.push(...topics);
  }
  candidates.push(...DEFAULT_SUGGESTIONS);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const topic of candidates) {
    const key = topic.toLowerCase();
    if (seen.has(key) || recentSet.has(key)) continue;
    seen.add(key);
    result.push(topic);
    if (result.length >= count) break;
  }

  // Si tous les sujets pertinents ont déjà été vus, on complète avec les
  // suggestions par défaut plutôt que de renvoyer une liste vide/incomplète.
  // Fix Q4 : utilise `seen` (insensible à la casse) et non result.includes()
  if (result.length < count) {
    for (const topic of DEFAULT_SUGGESTIONS) {
      const key = topic.toLowerCase();
      if (seen.has(key)) continue; // évite les doublons insensibles à la casse
      seen.add(key);
      result.push(topic);
      if (result.length >= count) break;
    }
  }

  return result.slice(0, count);
}
