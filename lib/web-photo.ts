/**
 * Service de recherche et d'importation de photos web illustratives
 * basées sur le titre et le sujet des leçons EasyLearn.
 * 
 * Interroge l'API REST de Wikipédia (FR & EN), Wikimedia Commons, et Unsplash
 * pour fournir de vraies photos d'illustration haute résolution.
 */

export interface WebPhoto {
  url: string;
  caption: string;
  source?: string;
}

export interface WebPhotoSearchResult {
  web_photo: WebPhoto;
  illustrative_photos: WebPhoto[];
}

/**
 * Nettoie le sujet pour optimiser la recherche web (retire les mots de liaison)
 */
function cleanSearchQuery(topic: string): string {
  return topic
    .trim()
    .replace(/^les?\s+/i, '')
    .replace(/^la\s+/i, '')
    .replace(/^l'/i, '')
    .replace(/^des?\s+/i, '')
    .replace(/^du\s+/i, '')
    .replace(/^une?\s+/i, '')
    .replace(/:\s*.*$/, '') // Enleve le sous-titre si présent (ex: "Les Dinosaures : Les Géants")
    .trim();
}

/**
 * Photos de secours haute résolution par domaine en cas de problème réseau
 */
function getFallbackPhotos(topic: string, subject?: string): WebPhotoSearchResult {
  const topicLower = (topic + ' ' + (subject || '')).toLowerCase();

  let mainUrl = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=80';
  let mainCaption = `Illustration visuelle de référence pour "${topic}"`;
  const extraPhotos: WebPhoto[] = [];

  if (topicLower.includes('bio') || topicLower.includes('cell') || topicLower.includes('atp') || topicLower.includes('adn') || topicLower.includes('plante') || topicLower.includes('photosynth')) {
    mainUrl = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80';
    mainCaption = `Microscopie et structures biologiques liées à ${topic}`;
    extraPhotos.push(
      { url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80', caption: 'Structure végétale et chloroplastes', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80', caption: 'Cellules et molécules du vivant', source: 'Unsplash' }
    );
  } else if (topicLower.includes('espac') || topicLower.includes('astron') || topicLower.includes('planete') || topicLower.includes('etoil') || topicLower.includes('trou noir') || topicLower.includes('soleil')) {
    mainUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80';
    mainCaption = `Vue cosmique et nébuleuse spatiale — ${topic}`;
    extraPhotos.push(
      { url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80', caption: 'Observatoire céleste et galaxies', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80', caption: 'Système stellaire et orbites', source: 'Unsplash' }
    );
  } else if (topicLower.includes('histoir') || topicLower.includes('romain') || topicLower.includes('egypt') || topicLower.includes('guer') || topicLower.includes('maroc') || topicLower.includes('revolution')) {
    mainUrl = 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1000&q=80';
    mainCaption = `Archives historiques et manuscrits de l'époque d'étude`;
    extraPhotos.push(
      { url: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80', caption: 'Monuments et vestiges historiques', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=800&q=80', caption: 'Cartes anciennes et documents d\'archive', source: 'Unsplash' }
    );
  } else if (topicLower.includes('math') || topicLower.includes('physic') || topicLower.includes('chimie') || topicLower.includes('batteri') || topicLower.includes('circuit')) {
    mainUrl = 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1000&q=80';
    mainCaption = `Expérimentation scientifique et modèle physique`;
    extraPhotos.push(
      { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', caption: 'Laboratoire de recherche et formules', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80', caption: 'Structure atomique et réactions', source: 'Unsplash' }
    );
  } else if (topicLower.includes('jeu') || topicLower.includes('informatiq') || topicLower.includes('code') || topicLower.includes('ai') || topicLower.includes('ia') || topicLower.includes('robot')) {
    mainUrl = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80';
    mainCaption = `Matrice technologique et algorithmes informatiques`;
    extraPhotos.push(
      { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', caption: 'Code source et flux de données', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', caption: 'Composants électroniques et processeurs', source: 'Unsplash' }
    );
  }

  return {
    web_photo: {
      url: mainUrl,
      caption: mainCaption,
      source: 'Banque d\'images de référence',
    },
    illustrative_photos: extraPhotos,
  };
}

/**
 * Recherche et importe des photos sur le web à partir du titre de la leçon.
 */
export async function fetchWebPhotosForTopic(
  topic: string,
  subject?: string
): Promise<WebPhotoSearchResult> {
  if (!topic || topic.trim().length === 0) {
    return getFallbackPhotos(topic, subject);
  }

  const cleanQuery = cleanSearchQuery(topic);
  const foundPhotos: WebPhoto[] = [];
  const seenUrls = new Set<string>();

  // Helper pour ajouter une photo valide sans doublon
  const addPhoto = (url: string | undefined, caption: string, source: string) => {
    if (!url || typeof url !== 'string') return;
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    if (seenUrls.has(url)) return;
    // Ignorer les petites icônes système SVG
    if (url.includes('symbol_') || url.includes('flag_') || url.includes('disambig')) return;

    seenUrls.add(url);
    foundPhotos.push({
      url,
      caption: caption || `Illustration web pour ${topic}`,
      source,
    });
  };

  try {
    // 1. Recherche Directe Wikipédia FR Summary (Très rapide & ultra précis)
    const wikiSummaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    const sumRes = await fetch(wikiSummaryUrl, { headers: { 'User-Agent': 'EasyLearn/1.0' }, next: { revalidate: 3600 } });
    if (sumRes.ok) {
      const data = await sumRes.json();
      const imgUrl = data.originalimage?.source || data.thumbnail?.source;
      if (imgUrl) {
        const desc = data.description || (data.extract ? data.extract.substring(0, 110) + '...' : data.title);
        addPhoto(imgUrl, `${data.title} — ${desc}`, `Wikipédia FR (${data.title})`);
      }
    }
  } catch (err) {
    console.warn('Erreur recherche Wikipedia Summary:', err);
  }

  try {
    // 2. Recherche Wikipédia FR Search API (Pour trouver 3-4 articles connexes)
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'EasyLearn/1.0' } });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const hits = searchData?.query?.search || [];
      
      // Parcourir les 4 premiers résultats de recherche en parallèle
      const fetchPromises = hits.slice(0, 4).map(async (hit: any) => {
        const hitSumUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
        const hitRes = await fetch(hitSumUrl, { headers: { 'User-Agent': 'EasyLearn/1.0' } });
        if (hitRes.ok) {
          const hitData = await hitRes.json();
          const imgUrl = hitData.originalimage?.source || hitData.thumbnail?.source;
          if (imgUrl) {
            const captionText = hitData.description ? `${hitData.title} : ${hitData.description}` : hitData.title;
            return { url: imgUrl, caption: captionText, title: hitData.title };
          }
        }
        return null;
      });

      const results = await Promise.allSettled(fetchPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && foundPhotos.length < 5) {
          addPhoto(result.value.url, result.value.caption, `Wikipédia (${result.value.title})`);
        }
      }
    }
  } catch (err) {
    console.warn('Erreur Wikipédia Search API:', err);
  }

  // 3. Si l'on n'a pas assez de photos en FR, interroger Wikipédia Anglais
  if (foundPhotos.length < 3) {
    try {
      const enSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
      const enRes = await fetch(enSummaryUrl, { headers: { 'User-Agent': 'EasyLearn/1.0' } });
      if (enRes.ok) {
        const enData = await enRes.json();
        const imgUrl = enData.originalimage?.source || enData.thumbnail?.source;
        if (imgUrl) {
          addPhoto(imgUrl, `Illustration générale — ${enData.title}`, `Wikipedia EN (${enData.title})`);
        }
      }
    } catch {}
  }

  // 4. Compléter ou fusionner avec les photos de secours si nécessaire
  const fallback = getFallbackPhotos(topic, subject);

  if (foundPhotos.length === 0) {
    return fallback;
  }

  const primaryWebPhoto = foundPhotos[0];
  const extraIllustrativePhotos = foundPhotos.slice(1);

  // Si on a moins de 2 photos d'illustration supplémentaires, compléter avec des photos thématiques d'Unsplash
  if (extraIllustrativePhotos.length < 2 && fallback.illustrative_photos.length > 0) {
    fallback.illustrative_photos.forEach((photo) => {
      if (!seenUrls.has(photo.url) && extraIllustrativePhotos.length < 4) {
        extraIllustrativePhotos.push(photo);
      }
    });
  }

  return {
    web_photo: primaryWebPhoto,
    illustrative_photos: extraIllustrativePhotos,
  };
}
