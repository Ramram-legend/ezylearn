/**
 * Demo Engine pour EasyLearn — permet une experience 100% fonctionnelle en local
 * et en mode demonstration sans necessiter de cles API Supabase ou Anthropic.
 */

import type { Profile, UserStats, Badge, Lesson, QuizQuestion } from '@/types/database';

export const CATALOG_INTERESTS = [
  { id: 'gaming', label: 'Jeux Vidéo', icon: '🎮', sort_order: 1 },
  { id: 'space', label: 'Espace & Cosmos', icon: '🚀', sort_order: 2 },
  { id: 'coding', label: 'Programmation', icon: '💻', sort_order: 3 },
  { id: 'biology', label: 'Animaux & Nature', icon: '🌿', sort_order: 4 },
  { id: 'art', label: 'Dessin & Art', icon: '🎨', sort_order: 5 },
  { id: 'music', label: 'Musique', icon: '🎵', sort_order: 6 },
  { id: 'history', label: 'Histoire & Légendes', icon: '📜', sort_order: 7 },
  { id: 'sports', label: 'Sports & Athlétisme', icon: '⚽', sort_order: 8 },
  { id: 'robotics', label: 'Robots & IA', icon: '🤖', sort_order: 9 },
  { id: 'cinema', label: 'Cinéma & Manga', icon: '🎬', sort_order: 10 },
  { id: 'chemistry', label: 'Expériences & Chimie', icon: '🧪', sort_order: 11 },
  { id: 'environment', label: 'Écologie & Planète', icon: '🌍', sort_order: 12 },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge-1',
    code: 'first_lesson',
    label: 'Première Étincelle',
    icon: '📖',
    description: 'Complète ta toute première leçon sur EasyLearn.',
    condition_type: 'lessons_count',
    condition_value: 1,
  },
  {
    id: 'badge-2',
    code: 'streak_3',
    label: 'Flamme d\'Apprentissage',
    icon: '🔥',
    description: 'Maintiens une série active pendant 3 jours consécutifs.',
    condition_type: 'streak',
    condition_value: 3,
  },
  {
    id: 'badge-3',
    code: 'perfect_quiz',
    label: 'Master du Quiz',
    icon: '🎯',
    description: 'Obtiens un score parfait de 3/3 à un quiz.',
    condition_type: 'perfect_score',
    condition_value: 1,
  },
  {
    id: 'badge-4',
    code: 'lessons_5',
    label: 'Explorateur du Savoir',
    icon: '🚀',
    description: 'Complète au moins 5 leçons personnalisées.',
    condition_type: 'lessons_count',
    condition_value: 5,
  },
  {
    id: 'badge-5',
    code: 'streak_7',
    label: 'Inarrêtable',
    icon: '⚡',
    description: 'Atteins 7 jours de série quotidienne d\'apprentissage.',
    condition_type: 'streak',
    condition_value: 7,
  },
  {
    id: 'badge-6',
    code: 'lessons_10',
    label: 'Savant Érudit',
    icon: '👑',
    description: 'Complète 10 leçons dans ton parcours adaptatif.',
    condition_type: 'lessons_count',
    condition_value: 10,
  },
];

const LOCAL_STORAGE_KEY_PROFILE = 'easylearn_demo_profile';
const LOCAL_STORAGE_KEY_STATS = 'easylearn_demo_stats';
const LOCAL_STORAGE_KEY_LESSONS = 'easylearn_demo_lessons';
const LOCAL_STORAGE_KEY_EARNED_BADGES = 'easylearn_demo_earned_badges';

export function getDemoProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDemoProfile(profile: Partial<Profile>): Profile {
  const existing = getDemoProfile();
  const age = profile.age ?? existing?.age ?? 14;
  let age_group: Profile['age_group'] = 'college_lycee';
  if (age <= 11) age_group = 'enfant';
  else if (age >= 18) age_group = 'etudiant_adulte';

  const updated: Profile = {
    id: existing?.id ?? 'demo-user-id',
    display_name: profile.display_name ?? existing?.display_name ?? 'Apprenant',
    age,
    age_group,
    interests: profile.interests ?? existing?.interests ?? ['space', 'coding', 'gaming'],
    plan: existing?.plan ?? 'gratuit',
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(updated));
  return updated;
}

export function getDemoStats(): UserStats {
  if (typeof window === 'undefined') {
    return {
      user_id: 'demo-user-id',
      total_xp: 50,
      current_streak: 1,
      longest_streak: 4,
      last_activity_date: new Date().toISOString(),
      lessons_completed: 3,
      quizzes_completed: 3,
      updated_at: new Date().toISOString(),
    };
  }

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_STATS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  const defaultStats: UserStats = {
    user_id: 'demo-user-id',
    total_xp: 50,
    current_streak: 1,
    longest_streak: 4,
    last_activity_date: new Date().toISOString(),
    lessons_completed: 3,
    quizzes_completed: 3,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_STORAGE_KEY_STATS, JSON.stringify(defaultStats));
  return defaultStats;
}

export function saveDemoStats(stats: UserStats): UserStats {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY_STATS, JSON.stringify(stats));
    window.dispatchEvent(new Event('demoStatsUpdated'));
  }
  return stats;
}

export function getDemoEarnedBadges(): Record<string, string> {
  if (typeof window === 'undefined') return { 'badge-1': new Date().toISOString() };
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_EARNED_BADGES);
  if (!raw) {
    const initial = { 'badge-1': new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY_EARNED_BADGES, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveDemoEarnedBadge(badgeId: string): Record<string, string> {
  const existing = getDemoEarnedBadges();
  existing[badgeId] = new Date().toISOString();
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY_EARNED_BADGES, JSON.stringify(existing));
  }
  return existing;
}

export function getDemoLessons(): Lesson[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LESSONS);
  if (!raw) return getPrepopulatedLessons();
  try {
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : getPrepopulatedLessons();
  } catch {
    return getPrepopulatedLessons();
  }
}

export function saveDemoLesson(lesson: Lesson): void {
  const existing = getDemoLessons();
  const updated = [lesson, ...existing.filter((l) => l.id !== lesson.id)];
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY_LESSONS, JSON.stringify(updated));
  }
}

/**
 * Genere un schema SVG anime adaptatif et elegant selon le sujet demande.
 */
export function generateDemoSvg(topic: string, subject: string): string {
  const cleanTopic = topic.toLowerCase();
  const cleanSubject = subject.toLowerCase();

  // 0a. Chimie / Batterie / Electricite / Circuit / Atome
  if (cleanTopic.includes('batteri') || cleanTopic.includes('batri') || cleanTopic.includes('chimie') || cleanTopic.includes('circuit') || cleanTopic.includes('atome') || cleanSubject.includes('chimie')) {
    return generateChemSvg(topic);
  }

  // 0b. Histoire / Geographie / Pays / Civilisation
  if (cleanTopic.includes('histoire') || cleanTopic.includes('maroc') || cleanTopic.includes('guerre') || cleanTopic.includes('empire') || cleanTopic.includes('civilisation') || cleanTopic.includes('revolution') || cleanTopic.includes('afrique') || cleanSubject.includes('histoire') || cleanSubject.includes('geographie')) {
    return generateHistSvg(topic);
  }

  // 1. Vitesse / Physique / Force / Mouvement
  if (cleanTopic.includes('vitesse') || cleanTopic.includes('physique') || cleanTopic.includes('force') || cleanTopic.includes('mouvement') || cleanTopic.includes('énergie') || cleanTopic.includes('accélération')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 270" width="100%" height="100%">
  <defs>
    <linearGradient id="speedBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#31104b"/>
    </linearGradient>
    <linearGradient id="speedGauge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    .speed-line { animation: dash 1.2s linear infinite; stroke-dasharray: 15,10; }
    .pulse-needle { animation: needleSweep 3s ease-in-out infinite alternate; transform-origin: 290px 170px; }
    .car-float { animation: floatSpeed 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate; filter: url(#glow); }
    @keyframes dash { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }
    @keyframes needleSweep { from { transform: rotate(-50deg); } to { transform: rotate(50deg); } }
    @keyframes floatSpeed { from { transform: translateY(0px); } to { transform: translateY(-12px); } }
  </style>
  <rect width="580" height="270" rx="16" fill="url(#speedBg)"/>
  
  <!-- Lines of speed in background -->
  <line x1="40" y1="60" x2="540" y2="60" stroke="rgba(56,189,248,0.2)" stroke-width="2" class="speed-line"/>
  <line x1="20" y1="120" x2="560" y2="120" stroke="rgba(245,158,11,0.25)" stroke-width="3" class="speed-line"/>
  <line x1="50" y1="210" x2="530" y2="210" stroke="rgba(239,68,68,0.2)" stroke-width="2" class="speed-line"/>

  <!-- Speedometer Arch -->
  <path d="M 200 170 A 90 90 0 0 1 380 170" stroke="url(#speedGauge)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="290" cy="170" r="12" fill="#38bdf8"/>
  
  <!-- Needle -->
  <line x1="290" y1="170" x2="220" y2="110" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" class="pulse-needle"/>

  <!-- Rocket / Vehicle illustration -->
  <g class="car-float">
    <path d="M 400 120 L 460 120 L 480 140 L 400 140 Z" fill="#38bdf8" opacity="0.9"/>
    <polygon points="460,120 490,130 460,140" fill="#f59e0b"/>
    <circle cx="420" cy="142" r="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="460" cy="142" r="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  </g>

  <!-- Labels -->
  <rect x="220" y="205" width="140" height="30" rx="8" fill="rgba(15,23,42,0.8)" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="290" y="225" text-anchor="middle" fill="#38bdf8" font-family="Inter, sans-serif" font-size="12" font-weight="700">v = d / t (Vitesse)</text>

  <text x="290" y="40" text-anchor="middle" fill="#f8fafc" font-family="Outfit, sans-serif" font-size="16" font-weight="800">⚡ ${escapeXml(topic)}</text>
</svg>`;
  }

  // 2. Espace / Astronomie
  if (cleanTopic.includes('espace') || cleanTopic.includes('trou noir') || cleanTopic.includes('planète') || cleanTopic.includes('fusée') || cleanTopic.includes('système solaire') || cleanSubject.includes('espace')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 270" width="100%" height="100%">
  <defs>
    <linearGradient id="spaceBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#31104b"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .star { animation: orbit 3s ease-in-out infinite alternate; }
    .orbit-ring { stroke: rgba(255,255,255,0.15); stroke-dasharray: 6,6; fill: none; }
    .planet { animation: spinOrbit 12s linear infinite; transform-origin: 290px 135px; }
    @keyframes spinOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes orbit { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
  </style>
  <rect width="580" height="270" rx="16" fill="url(#spaceBg)"/>
  <circle cx="80" cy="50" r="2" fill="#ffffff" class="star"/>
  <circle cx="480" cy="70" r="3" fill="#a855f7" class="star"/>
  <circle cx="510" cy="210" r="2" fill="#38bdf8" class="star"/>
  <circle cx="120" cy="220" r="2" fill="#ffffff" class="star"/>
  
  <circle cx="290" cy="135" r="45" fill="url(#sunGlow)"/>
  <circle cx="290" cy="135" r="85" class="orbit-ring" stroke-width="2"/>
  <circle cx="290" cy="135" r="140" class="orbit-ring" stroke-width="1.5"/>

  <g class="planet">
    <circle cx="375" cy="135" r="14" fill="#38bdf8"/>
    <circle cx="372" cy="130" r="4" fill="#7dd3fc" opacity="0.6"/>
  </g>
  <g class="planet" style="animation-duration: 20s; animation-direction: reverse;">
    <circle cx="150" cy="135" r="18" fill="#ec4899"/>
    <ellipse cx="150" cy="135" rx="26" ry="6" stroke="#f472b6" stroke-width="2" fill="none"/>
  </g>
  <text x="290" y="245" text-anchor="middle" fill="#f8fafc" font-family="Inter, sans-serif" font-size="14" font-weight="600">🚀 Exploration Cosmique — ${escapeXml(topic)}</text>
</svg>`;
  }

  // 3. Biologie / Plantes / Nature
  if (cleanTopic.includes('photosynthèse') || cleanTopic.includes('plante') || cleanTopic.includes('biologie') || cleanTopic.includes('nature') || cleanTopic.includes('arbre') || cleanTopic.includes('cellule')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 270" width="100%" height="100%">
  <defs>
    <linearGradient id="bioBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <radialGradient id="sunLight" cx="20%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .ray { animation: pulseRay 2s ease-in-out infinite alternate; stroke-dasharray: 4; }
    .leaf { animation: floatLeaf 4s ease-in-out infinite alternate; transform-origin: center; }
    @keyframes pulseRay { from { stroke-dashoffset: 0; opacity: 0.5; } to { stroke-dashoffset: 10; opacity: 1; } }
    @keyframes floatLeaf { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-6px) rotate(2deg); } }
  </style>
  <rect width="580" height="270" rx="16" fill="url(#bioBg)"/>
  <circle cx="80" cy="60" r="50" fill="url(#sunLight)"/>
  
  <path d="M 80 80 Q 200 130 320 120" stroke="#fef08a" stroke-width="3" class="ray" fill="none"/>
  <path d="M 90 90 Q 220 160 310 160" stroke="#fef08a" stroke-width="2" class="ray" fill="none"/>

  <g class="leaf">
    <path d="M 280 160 C 280 90, 420 80, 460 160 C 420 220, 280 230, 280 160 Z" fill="#10b981" stroke="#34d399" stroke-width="3"/>
    <path d="M 280 160 Q 370 160 460 160" stroke="#059669" stroke-width="3" fill="none"/>
    <path d="M 340 160 Q 370 130 390 120" stroke="#059669" stroke-width="2" fill="none"/>
    <path d="M 370 160 Q 400 185 420 195" stroke="#059669" stroke-width="2" fill="none"/>
  </g>

  <rect x="50" y="190" width="130" height="32" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)"/>
  <text x="115" y="211" text-anchor="middle" fill="#fef08a" font-family="Inter, sans-serif" font-size="12" font-weight="600">☀️ Énergie Solaire</text>

  <rect x="420" y="220" width="130" height="32" rx="8" fill="rgba(16,185,129,0.2)" stroke="#34d399"/>
  <text x="485" y="241" text-anchor="middle" fill="#34d399" font-family="Inter, sans-serif" font-size="12" font-weight="600">🌿 Glucose + O₂</text>

  <text x="290" y="255" text-anchor="middle" fill="#f8fafc" font-family="Inter, sans-serif" font-size="13" font-weight="600">🌿 Schéma Biologique — ${escapeXml(topic)}</text>
</svg>`;
  }

  // 4. Informatique / IA / Code / Robotique
  if (cleanTopic.includes('code') || cleanTopic.includes('python') || cleanTopic.includes('ia') || cleanTopic.includes('robot') || cleanTopic.includes('algorithme') || cleanTopic.includes('ordinateur') || cleanSubject.includes('informatique')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 270" width="100%" height="100%">
  <defs>
    <linearGradient id="codeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <style>
    .cursor { animation: blink 1s step-end infinite; }
    .pulse-box { animation: pulseBorder 2s ease-in-out infinite alternate; }
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes pulseBorder { from { stroke: #38bdf8; } to { stroke: #c084fc; } }
  </style>
  <rect width="580" height="270" rx="16" fill="#0f172a"/>
    .step-node { cursor: pointer; transition: all 0.25s; }
    .step-node:hover { filter: brightness(1.4); }
    .flow-arrow { stroke-dasharray: 8,4; animation: flow 1.2s linear infinite; }
    @keyframes flow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
    .code-tooltip { display: none; pointer-events: none; }
    .step-node.active .code-tooltip { display: block; }
  </style>
  <rect width="640" height="360" rx="18" fill="url(#codeBg)"/>

  <!-- Terminal window -->
  <rect x="30" y="50" width="340" height="270" rx="12" fill="#1c1917" stroke="#27272a" stroke-width="2"/>
  <rect x="30" y="50" width="340" height="36" rx="12" fill="#27272a"/>
  <circle cx="54" cy="68" r="6" fill="#ef4444"/>
  <circle cx="72" cy="68" r="6" fill="#f59e0b"/>
  <circle cx="90" cy="68" r="6" fill="#22c55e"/>
  <text x="200" y="73" text-anchor="middle" fill="#71717a" font-family="monospace" font-size="11">Terminal — ${escapeXml(topic)}</text>

  <!-- Code lines -->
  <text x="50" y="112" fill="#64748b" font-family="monospace" font-size="12">01  </text>
  <text x="80" y="112" fill="#818cf8" font-family="monospace" font-size="12">def </text>
  <text x="110" y="112" fill="#fef08a" font-family="monospace" font-size="12">${escapeXml(topic.replace(/\s+/g, '_').toLowerCase().substring(0,18))}():</text>

  <text x="50" y="136" fill="#64748b" font-family="monospace" font-size="12">02  </text>
  <text x="80" y="136" fill="#94a3b8" font-family="monospace" font-size="12">    # Initialisation</text>

  <text x="50" y="160" fill="#64748b" font-family="monospace" font-size="12">03  </text>
  <text x="80" y="160" fill="#818cf8" font-family="monospace" font-size="12">    input</text>
  <text x="128" y="160" fill="#f8fafc" font-family="monospace" font-size="12"> = collecter_données()</text>

  <text x="50" y="184" fill="#64748b" font-family="monospace" font-size="12">04  </text>
  <text x="80" y="184" fill="#818cf8" font-family="monospace" font-size="12">    résultat</text>
  <text x="146" y="184" fill="#f8fafc" font-family="monospace" font-size="12"> = traiter(input)</text>

  <text x="50" y="208" fill="#64748b" font-family="monospace" font-size="12">05  </text>
  <text x="80" y="208" fill="#4ade80" font-family="monospace" font-size="12">    return</text>
  <text x="130" y="208" fill="#f472b6" font-family="monospace" font-size="12"> "Succès ✓"</text>

  <text x="50" y="240" fill="#4ade80" font-family="monospace" font-size="13">&gt;&gt; OUTPUT: Apprentissage OK <tspan class="cursor" fill="#fff">_</tspan></text>

  <!-- Algorithm flowchart on right -->
  <text x="490" y="74" text-anchor="middle" fill="#e2e8f0" font-family="Outfit, sans-serif" font-size="14" font-weight="800">Flowchart</text>

  <!-- START -->
  <g class="step-node" tabindex="0" role="button" aria-label="Étape Départ">
    <rect x="430" y="90" width="120" height="36" rx="18" fill="#4f46e5" stroke="#818cf8" stroke-width="2"/>
    <text x="490" y="112" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="11" font-weight="700">▶ DÉBUT</text>
    <rect class="code-tooltip" x="380" y="80" width="50" height="22" rx="5" fill="#1e293b" stroke="#4f46e5"/>
    <text class="code-tooltip" x="405" y="95" text-anchor="middle" fill="#a5b4fc" font-family="Inter, sans-serif" font-size="8">Point de départ</text>
  </g>

  <!-- Arrow 1 -->
  <line x1="490" y1="126" x2="490" y2="150" stroke="#818cf8" stroke-width="2" class="flow-arrow"/>

  <!-- INPUT -->
  <g class="step-node" tabindex="0" role="button" aria-label="Entrée données">
    <rect x="425" y="150" width="130" height="36" rx="6" fill="#0e7490" stroke="#22d3ee" stroke-width="2"/>
    <text x="490" y="172" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="11" font-weight="700">📥 ENTRÉE</text>
    <rect class="code-tooltip" x="340" y="155" width="80" height="26" rx="5" fill="#1e293b" stroke="#22d3ee"/>
    <text class="code-tooltip" x="380" y="172" text-anchor="middle" fill="#67e8f9" font-family="Inter, sans-serif" font-size="9">Données à traiter</text>
  </g>

  <!-- Arrow 2 -->
  <line x1="490" y1="186" x2="490" y2="210" stroke="#22d3ee" stroke-width="2" class="flow-arrow"/>

  <!-- PROCESS -->
  <g class="step-node" tabindex="0" role="button" aria-label="Traitement algorithme">
    <rect x="418" y="210" width="144" height="36" rx="6" fill="#7c3aed" stroke="#a78bfa" stroke-width="2"/>
    <text x="490" y="232" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="11" font-weight="700">⚙️ TRAITEMENT</text>
    <rect class="code-tooltip" x="335" y="215" width="78" height="26" rx="5" fill="#1e293b" stroke="#7c3aed"/>
    <text class="code-tooltip" x="374" y="232" text-anchor="middle" fill="#c4b5fd" font-family="Inter, sans-serif" font-size="9">Algo s'exécute ici</text>
  </g>

  <!-- Arrow 3 -->
  <line x1="490" y1="246" x2="490" y2="270" stroke="#a78bfa" stroke-width="2" class="flow-arrow"/>

  <!-- OUTPUT -->
  <g class="step-node" tabindex="0" role="button" aria-label="Résultat de sortie">
    <rect x="425" y="270" width="130" height="36" rx="6" fill="#065f46" stroke="#4ade80" stroke-width="2"/>
    <text x="490" y="292" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="11" font-weight="700">📤 RÉSULTAT</text>
    <rect class="code-tooltip" x="340" y="275" width="80" height="26" rx="5" fill="#1e293b" stroke="#4ade80"/>
    <text class="code-tooltip" x="380" y="292" text-anchor="middle" fill="#86efac" font-family="Inter, sans-serif" font-size="9">Affichage du résultat</text>
  </g>

  <text x="320" y="350" text-anchor="middle" fill="#475569" font-family="Inter, sans-serif" font-size="10">👆 Clique sur chaque étape du flowchart pour comprendre son rôle</text>
  <script type="text/javascript">
    (function() {
      document.querySelectorAll('.step-node').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          var isActive = el.classList.contains('active');
          document.querySelectorAll('.step-node').forEach(function(x) { x.classList.remove('active'); });
          if (!isActive) el.classList.add('active');
        });
      });
    })();
  </script>
</svg>`;
  }

  // 5. Schéma générique — Cycle / Processus en 4 étapes interactives
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="genBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <style>
    .gen-node { cursor: pointer; transition: filter 0.25s; }
    .gen-node:hover { filter: brightness(1.5); }
    .gen-node.active circle { stroke-width: 5; filter: drop-shadow(0 0 12px currentColor); }
    .arc-flow { stroke-dasharray: 10,6; animation: arcAnim 2s linear infinite; }
    @keyframes arcAnim { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
    .gen-tooltip { display: none; pointer-events: none; }
    .gen-node.active .gen-tooltip { display: block; }
  </style>
  <rect width="640" height="360" rx="18" fill="url(#genBg)"/>

  <text x="320" y="34" text-anchor="middle" fill="#f8fafc" font-family="Outfit, sans-serif" font-size="18" font-weight="800">${escapeXml(topic)}</text>
  <text x="320" y="54" text-anchor="middle" fill="#818cf8" font-family="Inter, sans-serif" font-size="12">${escapeXml(subject)} — Processus en 4 étapes</text>

  <!-- Arcs between nodes -->
  <path d="M 180 130 Q 260 80 340 130" stroke="url(#arcGrad)" stroke-width="3" fill="none" class="arc-flow"/>
  <path d="M 340 130 Q 420 175 390 255" stroke="url(#arcGrad)" stroke-width="3" fill="none" class="arc-flow" style="animation-delay:0.5s"/>
  <path d="M 390 255 Q 260 310 180 255" stroke="url(#arcGrad)" stroke-width="3" fill="none" class="arc-flow" style="animation-delay:1s"/>
  <path d="M 180 255 Q 130 190 180 130" stroke="url(#arcGrad)" stroke-width="3" fill="none" class="arc-flow" style="animation-delay:1.5s"/>

  <!-- Node 1 — Observation -->
  <g class="gen-node" tabindex="0" role="button" aria-label="Étape 1 Observation">
    <circle cx="180" cy="130" r="40" fill="#1d4ed8" stroke="#60a5fa" stroke-width="3"/>
    <text x="180" y="125" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="18">🔍</text>
    <text x="180" y="142" text-anchor="middle" fill="#bfdbfe" font-family="Inter, sans-serif" font-size="10" font-weight="700">Observation</text>
    <rect class="gen-tooltip" x="30" y="85" width="130" height="44" rx="7" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
    <text class="gen-tooltip" x="95" y="104" text-anchor="middle" fill="#93c5fd" font-family="Inter, sans-serif" font-size="10" font-weight="700">1 — Observer</text>
    <text class="gen-tooltip" x="95" y="118" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Identifier le phénomène</text>
    <text class="gen-tooltip" x="95" y="131" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">et poser des questions</text>
  </g>

  <!-- Node 2 — Hypothèse -->
  <g class="gen-node" tabindex="0" role="button" aria-label="Étape 2 Hypothèse">
    <circle cx="390" cy="130" r="40" fill="#7c3aed" stroke="#a78bfa" stroke-width="3"/>
    <text x="390" y="125" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="18">💡</text>
    <text x="390" y="142" text-anchor="middle" fill="#ddd6fe" font-family="Inter, sans-serif" font-size="10" font-weight="700">Hypothèse</text>
    <rect class="gen-tooltip" x="435" y="85" width="140" height="44" rx="7" fill="#1e293b" stroke="#7c3aed" stroke-width="1.5"/>
    <text class="gen-tooltip" x="505" y="104" text-anchor="middle" fill="#c4b5fd" font-family="Inter, sans-serif" font-size="10" font-weight="700">2 — Formuler</text>
    <text class="gen-tooltip" x="505" y="118" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Proposer une explication</text>
    <text class="gen-tooltip" x="505" y="131" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">plausible et testable</text>
  </g>

  <!-- Node 3 — Expérimentation -->
  <g class="gen-node" tabindex="0" role="button" aria-label="Étape 3 Expérimentation">
    <circle cx="440" cy="255" r="40" fill="#0e7490" stroke="#22d3ee" stroke-width="3"/>
    <text x="440" y="250" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="18">⚗️</text>
    <text x="440" y="268" text-anchor="middle" fill="#a5f3fc" font-family="Inter, sans-serif" font-size="9" font-weight="700">Expériment.</text>
    <rect class="gen-tooltip" x="485" y="218" width="140" height="44" rx="7" fill="#1e293b" stroke="#0e7490" stroke-width="1.5"/>
    <text class="gen-tooltip" x="555" y="237" text-anchor="middle" fill="#67e8f9" font-family="Inter, sans-serif" font-size="10" font-weight="700">3 — Tester</text>
    <text class="gen-tooltip" x="555" y="251" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Conduire des expériences</text>
    <text class="gen-tooltip" x="555" y="264" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">et mesurer les résultats</text>
  </g>

  <!-- Node 4 — Conclusion -->
  <g class="gen-node" tabindex="0" role="button" aria-label="Étape 4 Conclusion">
    <circle cx="190" cy="255" r="40" fill="#065f46" stroke="#4ade80" stroke-width="3"/>
    <text x="190" y="250" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="18">✅</text>
    <text x="190" y="268" text-anchor="middle" fill="#86efac" font-family="Inter, sans-serif" font-size="10" font-weight="700">Conclusion</text>
    <rect class="gen-tooltip" x="20" y="218" width="145" height="44" rx="7" fill="#1e293b" stroke="#065f46" stroke-width="1.5"/>
    <text class="gen-tooltip" x="92" y="237" text-anchor="middle" fill="#4ade80" font-family="Inter, sans-serif" font-size="10" font-weight="700">4 — Conclure</text>
    <text class="gen-tooltip" x="92" y="251" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Valider ou rejeter</text>
    <text class="gen-tooltip" x="92" y="264" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">l'hypothèse initiale</text>
  </g>

  <!-- Center label -->
  <text x="310" y="192" text-anchor="middle" fill="#e2e8f0" font-family="Outfit, sans-serif" font-size="13" font-weight="700">Méthode</text>
  <text x="310" y="210" text-anchor="middle" fill="#818cf8" font-family="Inter, sans-serif" font-size="11">Scientifique</text>

  <text x="320" y="350" text-anchor="middle" fill="#475569" font-family="Inter, sans-serif" font-size="10">👆 Clique sur chaque étape pour en apprendre plus</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateChemSvg(topic: string): string {
  const t = escapeXml(topic);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="chemBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0c0a09"/><stop offset="100%" stop-color="#1c1917"/></linearGradient>
    <linearGradient id="battGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#4ade80"/></linearGradient>
    <filter id="gChem"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <style>
    .elec-flow { stroke-dasharray: 10,6; animation: eflow 1.2s linear infinite; }
    @keyframes eflow { from { stroke-dashoffset: 48; } to { stroke-dashoffset: 0; } }
    .ion { animation: ionBounce 2s ease-in-out infinite alternate; }
    @keyframes ionBounce { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
    .gen-node { cursor: pointer; }
  </style>
  <rect width="640" height="360" rx="18" fill="url(#chemBg)"/>
  <text x="320" y="34" text-anchor="middle" fill="#f8fafc" font-family="Outfit, sans-serif" font-size="18" font-weight="800">⚡ ${t}</text>
  <text x="320" y="56" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="11">Schéma d'une cellule électrochimique</text>
  <rect x="200" y="100" width="240" height="160" rx="16" fill="#1c1917" stroke="#22d3ee" stroke-width="3"/>
  <line x1="320" y1="110" x2="320" y2="250" stroke="#475569" stroke-width="3" stroke-dasharray="6,4"/>
  <g class="gen-node" tabindex="0" role="button" aria-label="Anode negative">
    <rect x="218" y="120" width="88" height="120" rx="10" fill="#1d4ed8" stroke="#60a5fa" stroke-width="2.5" filter="url(#gChem)"/>
    <text x="262" y="170" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="28" font-weight="900">-</text>
    <text x="262" y="195" text-anchor="middle" fill="#bfdbfe" font-family="Inter, sans-serif" font-size="11" font-weight="700">ANODE</text>
    <text x="262" y="212" text-anchor="middle" fill="#93c5fd" font-family="Inter, sans-serif" font-size="9">Zn - Zn2+ + 2e-</text>
    <rect class="gen-tooltip" x="35" y="95" width="155" height="64" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
    <text class="gen-tooltip" x="112" y="115" text-anchor="middle" fill="#93c5fd" font-family="Inter, sans-serif" font-size="10" font-weight="700">Anode (-) - Oxydation</text>
    <text class="gen-tooltip" x="112" y="130" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Le metal perd des electrons</text>
    <text class="gen-tooltip" x="112" y="145" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Zn - Zn2+ + 2e-</text>
    <text class="gen-tooltip" x="112" y="158" text-anchor="middle" fill="#60a5fa" font-family="Inter, sans-serif" font-size="9">Pole negatif de la batterie</text>
  </g>
  <g class="gen-node" tabindex="0" role="button" aria-label="Cathode positive">
    <rect x="334" y="120" width="88" height="120" rx="10" fill="#dc2626" stroke="#f87171" stroke-width="2.5" filter="url(#gChem)"/>
    <text x="378" y="170" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-size="28" font-weight="900">+</text>
    <text x="378" y="195" text-anchor="middle" fill="#fee2e2" font-family="Inter, sans-serif" font-size="11" font-weight="700">CATHODE</text>
    <text x="378" y="212" text-anchor="middle" fill="#fca5a5" font-family="Inter, sans-serif" font-size="9">Cu2+ + 2e- - Cu</text>
    <rect class="gen-tooltip" x="450" y="95" width="155" height="64" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
    <text class="gen-tooltip" x="527" y="115" text-anchor="middle" fill="#f87171" font-family="Inter, sans-serif" font-size="10" font-weight="700">Cathode (+) - Reduction</text>
    <text class="gen-tooltip" x="527" y="130" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Les electrons sont captes</text>
    <text class="gen-tooltip" x="527" y="145" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Cu2+ + 2e- - Cu</text>
    <text class="gen-tooltip" x="527" y="158" text-anchor="middle" fill="#f87171" font-family="Inter, sans-serif" font-size="9">Pole positif de la batterie</text>
  </g>
  <path d="M 262 100 Q 262 60 378 60 Q 490 60 490 180" stroke="url(#battGrad)" stroke-width="4" fill="none" class="elec-flow"/>
  <text x="370" y="48" text-anchor="middle" fill="#22d3ee" font-family="Inter, sans-serif" font-size="10" font-weight="700">e- circuit externe</text>
  <g class="ion" style="animation-delay:0s"><circle cx="290" cy="155" r="8" fill="rgba(34,211,238,0.2)" stroke="#22d3ee" stroke-width="1.5"/><text x="290" y="159" text-anchor="middle" fill="#22d3ee" font-family="Inter, sans-serif" font-size="7" font-weight="700">+</text></g>
  <g class="ion" style="animation-delay:0.5s"><circle cx="308" cy="200" r="8" fill="rgba(248,113,113,0.2)" stroke="#f87171" stroke-width="1.5"/><text x="308" y="204" text-anchor="middle" fill="#f87171" font-family="Inter, sans-serif" font-size="7" font-weight="700">-</text></g>
  <rect x="252" y="80" width="20" height="22" rx="3" fill="#60a5fa"/>
  <rect x="368" y="80" width="20" height="22" rx="3" fill="#f87171"/>
  <text x="320" y="345" text-anchor="middle" fill="#475569" font-family="Inter, sans-serif" font-size="10">Clique sur l'anode ou la cathode pour comprendre leur role</text>
</svg>`;
}

function generateHistSvg(topic: string): string {
  const t = escapeXml(topic);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="histBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1c0f00"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
    <linearGradient id="tlGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/></linearGradient>
    <filter id="gHist"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <style>
    .tl-dot { animation: dotPulse 2s ease-in-out infinite alternate; }
    @keyframes dotPulse { from { r: 10px; } to { r: 13px; } }
    .gen-node { cursor: pointer; }
  </style>
  <rect width="640" height="360" rx="18" fill="url(#histBg)"/>
  <text x="320" y="36" text-anchor="middle" fill="#fef08a" font-family="Outfit, sans-serif" font-size="18" font-weight="800">Frise — ${t}</text>
  <text x="320" y="58" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="11">Frise Chronologique Interactive</text>
  <line x1="80" y1="185" x2="560" y2="185" stroke="url(#tlGrad)" stroke-width="4" stroke-linecap="round"/>
  <g class="gen-node" tabindex="0" role="button" aria-label="Fondation">
    <circle cx="140" cy="185" r="13" fill="#f59e0b" stroke="#fef08a" stroke-width="3" class="tl-dot" filter="url(#gHist)"/>
    <text x="140" y="226" text-anchor="middle" fill="#fef08a" font-family="Inter, sans-serif" font-size="9" font-weight="700">Fondation</text>
    <line x1="140" y1="172" x2="140" y2="125" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3"/>
    <rect x="78" y="90" width="124" height="36" rx="7" fill="#1c1917" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="140" y="107" text-anchor="middle" fill="#fbbf24" font-family="Inter, sans-serif" font-size="9" font-weight="700">Origines</text>
    <text x="140" y="121" text-anchor="middle" fill="#78716c" font-family="Inter, sans-serif" font-size="8">Periode initiale</text>
    <rect class="gen-tooltip" x="28" y="248" width="165" height="52" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
    <text class="gen-tooltip" x="110" y="268" text-anchor="middle" fill="#fbbf24" font-family="Inter, sans-serif" font-size="10" font-weight="700">Fondation - Debuts</text>
    <text class="gen-tooltip" x="110" y="283" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Naissance et premieres traces</text>
    <text class="gen-tooltip" x="110" y="296" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Epoque : Antiquite / Medieval</text>
  </g>
  <g class="gen-node" tabindex="0" role="button" aria-label="Apogee">
    <circle cx="283" cy="185" r="13" fill="#ec4899" stroke="#f9a8d4" stroke-width="3" class="tl-dot" style="animation-delay:0.6s" filter="url(#gHist)"/>
    <text x="283" y="226" text-anchor="middle" fill="#f9a8d4" font-family="Inter, sans-serif" font-size="9" font-weight="700">Apogee</text>
    <line x1="283" y1="198" x2="283" y2="248" stroke="#ec4899" stroke-width="1.5" stroke-dasharray="4,3"/>
    <rect x="221" y="248" width="124" height="36" rx="7" fill="#1c1917" stroke="#ec4899" stroke-width="1.5"/>
    <text x="283" y="265" text-anchor="middle" fill="#f9a8d4" font-family="Inter, sans-serif" font-size="9" font-weight="700">Expansion</text>
    <text x="283" y="279" text-anchor="middle" fill="#78716c" font-family="Inter, sans-serif" font-size="8">Age d'or</text>
    <rect class="gen-tooltip" x="170" y="130" width="165" height="52" rx="8" fill="#1e293b" stroke="#ec4899" stroke-width="1.5"/>
    <text class="gen-tooltip" x="252" y="150" text-anchor="middle" fill="#f9a8d4" font-family="Inter, sans-serif" font-size="10" font-weight="700">Apogee - Expansion</text>
    <text class="gen-tooltip" x="252" y="165" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Phase de croissance et puissance</text>
    <text class="gen-tooltip" x="252" y="180" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Epoque : Age d'or</text>
  </g>
  <g class="gen-node" tabindex="0" role="button" aria-label="Tournant">
    <circle cx="426" cy="185" r="13" fill="#8b5cf6" stroke="#c4b5fd" stroke-width="3" class="tl-dot" style="animation-delay:1.2s" filter="url(#gHist)"/>
    <text x="426" y="226" text-anchor="middle" fill="#c4b5fd" font-family="Inter, sans-serif" font-size="9" font-weight="700">Tournant</text>
    <line x1="426" y1="172" x2="426" y2="125" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="4,3"/>
    <rect x="364" y="90" width="124" height="36" rx="7" fill="#1c1917" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="426" y="107" text-anchor="middle" fill="#c4b5fd" font-family="Inter, sans-serif" font-size="9" font-weight="700">Rupture</text>
    <text x="426" y="121" text-anchor="middle" fill="#78716c" font-family="Inter, sans-serif" font-size="8">Changement majeur</text>
    <rect class="gen-tooltip" x="325" y="248" width="165" height="52" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>
    <text class="gen-tooltip" x="407" y="268" text-anchor="middle" fill="#c4b5fd" font-family="Inter, sans-serif" font-size="10" font-weight="700">Tournant Historique</text>
    <text class="gen-tooltip" x="407" y="283" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Rupture ou transition capitale</text>
    <text class="gen-tooltip" x="407" y="296" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Epoque : Periode de transition</text>
  </g>
  <g class="gen-node" tabindex="0" role="button" aria-label="Heritage actuel">
    <circle cx="543" cy="185" r="13" fill="#10b981" stroke="#34d399" stroke-width="3" class="tl-dot" style="animation-delay:1.8s" filter="url(#gHist)"/>
    <text x="543" y="226" text-anchor="middle" fill="#34d399" font-family="Inter, sans-serif" font-size="9" font-weight="700">Heritage</text>
    <line x1="543" y1="198" x2="543" y2="248" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,3"/>
    <rect x="479" y="248" width="124" height="36" rx="7" fill="#1c1917" stroke="#10b981" stroke-width="1.5"/>
    <text x="541" y="265" text-anchor="middle" fill="#34d399" font-family="Inter, sans-serif" font-size="9" font-weight="700">Aujourd'hui</text>
    <text x="541" y="279" text-anchor="middle" fill="#78716c" font-family="Inter, sans-serif" font-size="8">Impact actuel</text>
    <rect class="gen-tooltip" x="460" y="130" width="165" height="52" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
    <text class="gen-tooltip" x="542" y="150" text-anchor="middle" fill="#34d399" font-family="Inter, sans-serif" font-size="10" font-weight="700">Heritage et Impact</text>
    <text class="gen-tooltip" x="542" y="165" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="9">Consequences dans le monde</text>
    <text class="gen-tooltip" x="542" y="180" text-anchor="middle" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="9">Present : Heritage vivant</text>
  </g>
  <text x="320" y="345" text-anchor="middle" fill="#475569" font-family="Inter, sans-serif" font-size="10">Clique sur chaque etape de la frise pour en savoir plus</text>
</svg>`;
}

export function createDemoLesson(topic: string, subject = 'Sciences', level = 'Intermédiaire'): Lesson {
  const profile = getDemoProfile();
  const rawInterests = profile?.interests ?? ['gaming', 'space', 'history'];
  
  // Convert interest keys to human readable labels if matched
  const interestLabels = rawInterests.map((item) => {
    const found = CATALOG_INTERESTS.find((c) => c.id === item || c.label.toLowerCase() === item.toLowerCase());
    return found ? found.label : item;
  });

  const mainInterest = interestLabels.length > 0 ? interestLabels[0] : 'vos centres d\'intérêt';
  const secondInterest = interestLabels.length > 1 ? interestLabels[1] : 'l\'exploration du savoir';

  const svg = generateDemoSvg(topic, subject);

  let explanation = `Puisque tu te passionnes pour **${mainInterest}**, la leçon sur "${topic}" te permettra de comprendre les mécanismes fondamentaux sous-jacents en établissant un parallèle direct avec tes centres d'intérêt !`;
  let fun_fact = `Le savais-tu ? Tout comme dans **${mainInterest}** et **${secondInterest}**, les principes derrière "${topic}" reposent sur une structure captivante réutilisée dans la science moderne !`;

  const sections = [
    {
      heading: `1. Comprendre ${topic} via ${mainInterest}`,
      body_markdown: `Dans l'univers de **${mainInterest}**, chaque élément obéit à des règles précises. De la même façon, **${topic}** s'explique par une suite d'interactions et de principes fondamentaux. En visualisant ce phénomène comme un système interactif, la compréhension devient immédiate et intuitive.`,
      visualization: null,
    },
    {
      heading: `2. Applications concrètes et analogies avec ${secondInterest}`,
      body_markdown: `Que l'on s'intéresse à **${secondInterest}** ou à des concepts plus techniques, la logique reste similaire : transformer la théorie en pratique. Observez l'illustration vectorielle ci-dessus pour visualiser le flux et les composants majeurs du phénomène.`,
      visualization: null,
    },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: `Quel est l'élément central à retenir au sujet de "${topic}" ?`,
      options: [
        `Il s'agit d'un mécanisme clé interconnecté avec son environnement`,
        `C'est un phénomène uniquement théorique sans application pratique`,
        `Il n'a aucun impact sur notre vie quotidienne`,
        `C'est une découverte totalement fortuite datant d'hier`,
      ],
      correct_index: 0,
    },
    {
      question: `Comment peut-on appliquer les concepts de ${topic} ?`,
      options: [
        `En ignorant les données expérimentales`,
        `En structurant les étapes de façon méthodique et adaptative`,
        `En arrêtant d'apprendre après la première étape`,
        `En comptant uniquement sur le hasard`,
      ],
      correct_index: 1,
    },
    {
      question: `Quelle est la principale caractéristique de ce sujet en ${subject} ?`,
      options: [
        `Sa complexité le rend impossible à modéliser`,
        `Sa simplicité absolue qui n'a pas besoin de schéma`,
        `Son adaptabilité et son intégration dans de nombreux domaines`,
        `Son inexistence dans le monde réel`,
      ],
      correct_index: 2,
    },
  ];

  const lessonId = `lesson-demo-${Date.now()}`;
  const lesson: Lesson = {
    id: lessonId,
    user_id: 'demo-user-id',
    topic,
    subject,
    level,
    content: {
      title: topic,
      svg,
      explanation,
      fun_fact,
      web_photo: {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        caption: `Photographie de référence illustrant ${topic}`,
      },
      sections,
      chapter_index: 1,
      total_chapters: 4,
      is_completed: false,
    },
    quiz,
    created_at: new Date().toISOString(),
  };

  saveDemoLesson(lesson);
  return lesson;
}

export function continueDemoLesson(parentLesson: Lesson): Lesson {
  const currentChapter = parentLesson.content.chapter_index || 1;
  const nextChapter = currentChapter + 1;
  const totalChapters = parentLesson.content.total_chapters || 4;
  const isCompleted = nextChapter >= totalChapters;

  const topic = parentLesson.topic;
  const subject = parentLesson.subject;
  const level = parentLesson.level;

  const profile = getDemoProfile();
  const rawInterests = profile?.interests ?? ['gaming', 'space'];
  const interestLabels = rawInterests.map((item) => {
    const found = CATALOG_INTERESTS.find((c) => c.id === item || c.label.toLowerCase() === item.toLowerCase());
    return found ? found.label : item;
  });
  const mainInterest = interestLabels[0] || 'vos centres d\'intérêt';

  const svg = generateDemoSvg(topic, subject);
  const previous_summary = `Dans le Chapitre ${currentChapter}, nous avons abordé les fondamentaux de "${topic}" et leur rôle clé.`;
  const explanation = `Bienvenue au Chapitre ${nextChapter} sur "${topic}" ! Nous allons maintenant approfondir des notions plus avancées et explorer des exemples concrets.`;

  const viz1Code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 240" width="100%" height="100%">
  <defs>
    <linearGradient id="vizGrad${nextChapter}A" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <style>
    .pulse-node { animation: nodePulse 2s ease-in-out infinite alternate; cursor: pointer; }
    .flow-line { stroke-dasharray: 6,6; animation: dashFlow 10s linear infinite; }
    @keyframes dashFlow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
    @keyframes nodePulse { from { transform: scale(1); } to { transform: scale(1.06); } }
  </style>
  <rect width="500" height="240" rx="12" fill="url(#vizGrad${nextChapter}A)"/>
  <path d="M 80 120 Q 250 40 420 120" stroke="#38bdf8" stroke-width="3" fill="none" class="flow-line"/>
  <path d="M 80 120 Q 250 200 420 120" stroke="#c084fc" stroke-width="3" fill="none" class="flow-line"/>
  
  <g class="pulse-node" id="n1-${nextChapter}">
    <circle cx="80" cy="120" r="28" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
    <text x="80" y="125" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">Chap.${nextChapter}</text>
  </g>
  <g class="pulse-node" style="animation-delay: 0.5s;" id="n2-${nextChapter}">
    <circle cx="250" cy="120" r="34" fill="#6366f1" stroke="#818cf8" stroke-width="3"/>
    <text x="250" y="125" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18">⚡</text>
  </g>
  <g class="pulse-node" style="animation-delay: 1s;" id="n3-${nextChapter}">
    <circle cx="420" cy="120" r="28" fill="#ec4899" stroke="#f472b6" stroke-width="3"/>
    <text x="420" y="125" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">Mastery</text>
  </g>
  <text x="250" y="35" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(topic)} — Chapitre ${nextChapter}</text>
  <text x="250" y="215" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="11">💡 Cliquez sur les composants pour voir l'effet dynamique</text>
</svg>
<script>
  document.querySelectorAll('.pulse-node').forEach(function(node) {
    node.addEventListener('click', function() {
      alert('Nœud interactif cliqué : Chapitre ${nextChapter} de ${escapeXml(topic)}');
    });
  });
</script>`;

  const viz2Code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 240" width="100%" height="100%">
  <defs>
    <linearGradient id="vizGrad${nextChapter}B" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <style>
    .gear { animation: spin 8s linear infinite; transform-origin: 250px 120px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  </style>
  <rect width="500" height="240" rx="12" fill="url(#vizGrad${nextChapter}B)"/>
  <circle cx="250" cy="120" r="55" fill="none" stroke="#10b981" stroke-width="6" stroke-dasharray="14,8" class="gear"/>
  <circle cx="250" cy="120" r="30" fill="#059669" stroke="#34d399" stroke-width="3"/>
  <text x="250" y="125" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">⚙️ ${nextChapter}/${totalChapters}</text>
  <text x="250" y="35" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="14" font-weight="bold">Moteur Pédagogique — ${escapeXml(mainInterest)}</text>
</svg>`;

  const sections = [
    {
      heading: `Approfondissement : Chapitre ${nextChapter} de ${topic}`,
      body_markdown: `Dans ce chapitre ${nextChapter}, nous franchissons un niveau supérieur. Nous analysons comment les éléments clés de **${topic}** s'articulent dans des situations plus exigeantes.`,
      visualization: {
        type: 'svg' as const,
        code: viz1Code,
        caption: `Schéma interactif : Flux dynamique du Chapitre ${nextChapter}`,
        controls: ['click', 'drag', 'hover'],
      },
    },
    {
      heading: `Cas Pratiques & Perspective`,
      body_markdown: `En reliant ces notions à **${mainInterest}**, on s'aperçoit que chaque concept s'inscrit dans une suite logique. Votre compréhension devient globale et approfondie.`,
      visualization: {
        type: 'svg' as const,
        code: viz2Code,
        caption: `Simulation de rotation : Mécanique et synergie`,
        controls: ['spin', 'hover'],
      },
    },
  ];

  const quiz: QuizQuestion[] = [
    {
      question: `Quelle notion avancée est mise en avant dans ce Chapitre ${nextChapter} sur "${topic}" ?`,
      options: [
        `L'analyse approfondie des mécanismes et des cas pratiques`,
        `Une simple copie de la leçon précédente`,
        `Un abandon complet du sujet principal`,
        `Une théorie déconnectée de tout exemple`,
      ],
      correct_index: 0,
    },
    {
      question: `Quel est l'objectif de ce Chapitre ${nextChapter} ?`,
      options: [
        `Enrichir vos connaissances sans répéter les notions déjà acquises`,
        `Recommencer depuis le début sans progresser`,
        `Ignorer la théorie fondamentale`,
        `Passer directement à un sujet sans lien`,
      ],
      correct_index: 0,
    },
    {
      question: `Où en êtes-vous dans ce parcours sur "${topic}" ?`,
      options: [
        isCompleted ? `Dernier chapitre : vous avez une compréhension complète !` : `Chapitre ${nextChapter} sur ${totalChapters} : progression active`,
        `Aucun chapitre complété`,
        `Début de la première notion`,
        `Erreur de parcours`,
      ],
      correct_index: 0,
    },
  ];

  const lessonId = `lesson-demo-${Date.now()}`;
  const lesson: Lesson = {
    id: lessonId,
    user_id: 'demo-user-id',
    topic,
    subject,
    level,
    parent_lesson_id: parentLesson.id,
    content: {
      title: `Chapitre ${nextChapter} : ${topic}`,
      svg,
      explanation,
      fun_fact: `Le savais-tu ? Au Chapitre ${nextChapter}, tu as déjà validé ${Math.round((nextChapter / totalChapters) * 100)}% du parcours sur ce sujet !`,
      web_photo: {
        url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
        caption: `Photo d'illustration web - Chapitre ${nextChapter} de ${topic}`,
      },
      sections,
      previous_summary,
      chapter_index: nextChapter,
      total_chapters: totalChapters,
      is_completed: isCompleted,
      parent_lesson_id: parentLesson.id,
    },
    quiz,
    created_at: new Date().toISOString(),
  };

  saveDemoLesson(lesson);
  return lesson;
}

function getPrepopulatedLessons(): Lesson[] {
  return [
    {
      id: 'demo-lesson-photosynthesis',
      user_id: 'demo-user-id',
      topic: 'La Photosynthèse',
      subject: 'Biologie',
      level: 'Intermédiaire',
      content: {
        title: 'La Photosynthèse',
        svg: generateDemoSvg('La Photosynthèse', 'Biologie'),
        explanation: 'La photosynthèse est le processus par lequel les plantes vertes transforment la lumière du soleil, le dioxyde de carbone (CO₂) et l\'eau en glucose et en oxygène (O₂). C\'est le poumon végétal de notre planète !',
        fun_fact: 'Une seule feuille d\'arbre contient des millions de petites usines solaires appelées chloroplastes !',
      },
      quiz: [
        {
          question: 'De quoi les plantes ont-elles besoin pour réaliser la photosynthèse ?',
          options: [
            'Lumière du soleil, eau et dioxyde de carbone',
            'Seulement de l\'électricité',
            'Uniquement de la terre sèche',
            'De la glace et du sucre',
          ],
          correct_index: 0,
        },
        {
          question: 'Quel gaz essentiel la plante rejette-t-elle dans l\'air ?',
          options: ['Azote', 'Oxygène (O₂)', 'Méthane', 'Argon'],
          correct_index: 1,
        },
        {
          question: 'Où se déroule la photosynthèse dans la cellule végétale ?',
          options: ['Dans le noyau', 'Dans la membrane', 'Dans les chloroplastes', 'Dans les mitochondries'],
          correct_index: 2,
        },
      ],
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'demo-lesson-black-holes',
      user_id: 'demo-user-id',
      topic: 'Les Trous Noirs',
      subject: 'Physique & Espace',
      level: 'Avancé',
      content: {
        title: 'Les Trous Noirs',
        svg: generateDemoSvg('Les Trous Noirs', 'Espace'),
        explanation: 'Un trou noir est une région de l\'espace où la gravité est tellement intense que rien, pas même la lumière, ne peut s\'en échapper. Il se forme généralement lorsqu\'une étoile très massive s\'effondre sur elle-même.',
        fun_fact: 'Si vous vous approchiez trop près d\'un trou noir, la gravité déformerait le temps autour de vous !',
      },
      quiz: [
        {
          question: 'Pourquoi la lumière ne peut-elle pas s\'échapper d\'un trou noir ?',
          options: [
            'Parce que la gravité y est extrême',
            'Parce qu\'il fait trop froid',
            'Parce que le trou noir est peint en noir',
            'Parce que les étoiles s\'éteignent',
          ],
          correct_index: 0,
        },
        {
          question: 'Comment s\'appelle la frontière au-delà de laquelle rien ne peut revenir ?',
          options: ['L\'horizon des événements', 'Le mur sonore', 'La ceinture d\'astéroïdes', 'Le vortex solaire'],
          correct_index: 0,
        },
        {
          question: 'Que trouve-t-on au centre d\'un trou noir selon la théorie ?',
          options: ['Une planète cachée', 'Une singularité', 'Un tunnel en verre', 'Une nébuleuse'],
          correct_index: 1,
        },
      ],
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];
}
