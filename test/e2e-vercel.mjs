/**
 * ════════════════════════════════════════════════════════════════
 *  EasyLearn — Tests E2E sur le déploiement Vercel de production
 *  Fichier : test/e2e-vercel.mjs
 *
 *  Lancement rapide  : node test/e2e-vercel.mjs
 *  Sans tests IA     : node test/e2e-vercel.mjs --skip-ai
 *  Suite spécifique  : node test/e2e-vercel.mjs --suite=3
 * ════════════════════════════════════════════════════════════════
 */

const BASE_URL = 'https://easylearn-ochre.vercel.app';

// ─── CLI flags ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const SKIP_AI   = args.includes('--skip-ai');
const ONLY_SUITE = (() => {
  const s = args.find(a => a.startsWith('--suite='));
  return s ? parseInt(s.split('=')[1], 10) : null;
})();

// ─── Helpers ────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

let passed = 0, failed = 0, warned = 0;
const results = [];

function log(msg) { console.log(msg); }
function ok(label, detail = '')  { passed++; results.push({ status: '✅', label, detail }); log(`  ${GREEN}✅ ${label}${RESET}${detail ? ` ${DIM}— ${detail}${RESET}` : ''}`); }
function fail(label, detail = ''){ failed++; results.push({ status: '❌', label, detail }); log(`  ${RED}❌ ${label}${RESET}${detail ? ` ${DIM}— ${detail}${RESET}` : ''}`); }
function warn(label, detail = ''){ warned++; results.push({ status: '⚠️', label, detail }); log(`  ${YELLOW}⚠️  ${label}${RESET}${detail ? ` ${DIM}— ${detail}${RESET}` : ''}`); }

function section(title) {
  log(`\n${BOLD}${CYAN}━━━  ${title}  ━━━${RESET}`);
}

/**
 * Fetch avec timeout et capture des headers
 */
async function fetchTest(path, options = {}, timeoutMs = 15000) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 1 — Pages publiques (HTML)
// ════════════════════════════════════════════════════════════════
async function testPublicPages() {
  section('SUITE 1 — Pages publiques');

  const pages = [
    { path: '/',              expect: 200,        name: 'Page d\'accueil (/)' },
    { path: '/dashboard',     expect: [200, 307], name: 'Dashboard (/dashboard)' },
    { path: '/progress',      expect: [200, 307], name: 'Page progression (/progress)' },
  ];

  for (const { path, expect: expected, name } of pages) {
    try {
      const res = await fetchTest(path, { redirect: 'follow' });
      const expectedArr = Array.isArray(expected) ? expected : [expected];
      const ct = res.headers.get('content-type') || '';
      if (expectedArr.includes(res.status)) {
        ok(name, `HTTP ${res.status} | ${ct.split(';')[0]}`);
      } else {
        fail(name, `HTTP ${res.status} (attendu: ${expectedArr.join('|')})`);
      }
    } catch (err) {
      fail(name, `Erreur réseau: ${err.message}`);
    }
  }

  // 404 personnalisée
  try {
    const res = await fetchTest('/page-qui-nexiste-pas-xYz123', { redirect: 'follow' });
    if (res.status === 404) {
      ok('Page 404 personnalisée', `HTTP ${res.status}`);
    } else {
      warn('Page 404 personnalisée', `HTTP ${res.status} (attendu 404)`);
    }
  } catch (err) {
    fail('Page 404 personnalisée', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 2 — Headers de sécurité (T7)
// ════════════════════════════════════════════════════════════════
async function testSecurityHeaders() {
  section('SUITE 2 — Headers de sécurité (T7 — next.config.js)');

  let res;
  try {
    res = await fetchTest('/', { redirect: 'follow' });
  } catch (err) {
    fail('Requête headers de sécurité', err.message);
    return;
  }

  const requiredHeaders = [
    { key: 'x-frame-options',            expected: 'DENY',         name: 'X-Frame-Options' },
    { key: 'x-content-type-options',      expected: 'nosniff',      name: 'X-Content-Type-Options' },
    { key: 'referrer-policy',             expected: null,            name: 'Referrer-Policy' },
    { key: 'permissions-policy',          expected: null,            name: 'Permissions-Policy' },
    { key: 'content-security-policy',     expected: null,            name: 'Content-Security-Policy' },
    { key: 'x-dns-prefetch-control',      expected: null,            name: 'X-DNS-Prefetch-Control' },
  ];

  for (const { key, expected, name } of requiredHeaders) {
    const value = res.headers.get(key);
    if (!value) {
      fail(name, `Header manquant (${key})`);
    } else if (expected && !value.toLowerCase().includes(expected.toLowerCase())) {
      warn(name, `Valeur: "${value}" (attendu: "${expected}")`);
    } else {
      ok(name, `"${value.substring(0, 60)}${value.length > 60 ? '…' : ''}"`);
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 3 — API /api/quests (F3)
// ════════════════════════════════════════════════════════════════
async function testQuestsAPI() {
  section('SUITE 3 — API /api/quests (F3 — Quêtes quotidiennes)');

  // Test non authentifié → 401
  try {
    const res = await fetchTest('/api/quests');
    const json = await res.json().catch(() => null);

    if (res.status === 401) {
      ok('GET /api/quests sans auth → 401', 'Rejet correct des invités');
    } else if (res.status === 200 && json?.quests) {
      ok('GET /api/quests → 200 + données', `${json.quests.length} quêtes retournées`);

      // Valider la structure
      const q = json.quests[0];
      const hasFields = q && ['id','title','desc','icon','progress','total','xpBonus','completed']
        .every(f => f in q);
      if (hasFields) {
        ok('Structure des quêtes valide', `id="${q.id}", xpBonus=${q.xpBonus}`);
      } else {
        fail('Structure des quêtes invalide', `Champs manquants: ${JSON.stringify(q)}`);
      }

      if (typeof json.completedCount === 'number' && typeof json.totalXpAvailable === 'number') {
        ok('Méta-données quêtes présentes', `completedCount=${json.completedCount}, totalXP=${json.totalXpAvailable}`);
      } else {
        warn('Méta-données quêtes incomplètes', JSON.stringify(json));
      }
    } else {
      warn('GET /api/quests', `HTTP ${res.status} — ${JSON.stringify(json)}`);
    }
  } catch (err) {
    fail('GET /api/quests', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 4 — Rate-limit invités (F4)
// ════════════════════════════════════════════════════════════════
async function testGuestRateLimit() {
  section('SUITE 4 — Rate-limit invités (F4 — 3 leçons/jour)');

  const body = JSON.stringify({ topic: 'La photosynthèse', subject: 'Biologie', level: 'Débutant', age: 12 });
  const headers = { 'Content-Type': 'application/json' };

  let cookieJar = '';

  // On fait 4 requêtes pour déclencher le rate-limit
  // Note: on utilise le cookie renvoyé par le serveur pour simuler un vrai navigateur
  for (let i = 1; i <= 4; i++) {
    try {
      const reqHeaders = { ...headers };
      // Renvoyer le cookie reçu lors de l'appel précédent
      if (cookieJar) reqHeaders['Cookie'] = cookieJar;

      const res = await fetchTest('/api/lessons/generate', {
        method: 'POST',
        headers: reqHeaders,
        body,
        redirect: 'follow',
      }, 90000); // 90s timeout pour la génération IA

      // Extraire TOUS les cookies de Set-Cookie pour la prochaine requête
      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        // Extraire guest_rl=<value> (avant le premier ';')
        const match = setCookieHeader.match(/guest_rl=([^;]+)/);
        if (match) cookieJar = `guest_rl=${match[1]}`;
      }

      const json = await res.json().catch(() => null);

      if (i <= 3) {
        // Les 3 premières doivent passer (200 ou erreur IA mais pas 429)
        if (res.status === 200) {
          ok(`Requête invité #${i} → acceptée`, `Leçon générée: "${json?.lesson?.topic || 'ok'}"`);
        } else if (res.status === 429) {
          fail(`Requête invité #${i} → rate-limitée trop tôt`, `Doit accepter jusqu'à 3 requêtes`);
        } else if (res.status === 502 || res.status === 500) {
          warn(`Requête invité #${i} → erreur IA (${res.status})`, json?.error || 'Erreur génération');
        } else {
          warn(`Requête invité #${i} → HTTP ${res.status}`, JSON.stringify(json)?.substring(0, 100));
        }
      } else {
        // La 4ème doit être bloquée
        if (res.status === 429) {
          const hasRequiresAuth = json?.requiresAuth === true;
          const hasMessage = json?.error?.includes('Limite');
          ok(`Requête invité #${i} → rate-limited (429)`, `requiresAuth=${hasRequiresAuth}, message=${hasMessage}`);
        } else {
          fail(`Requête invité #${i} → NON rate-limited`, `HTTP ${res.status} (attendu 429)`);
        }
      }
    } catch (err) {
      if (i <= 3) {
        warn(`Requête invité #${i}`, `Timeout/erreur réseau: ${err.message}`);
      } else {
        fail(`Requête invité #${i}`, err.message);
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 5 — API /api/chat (F1 — Tuteur IA)
// ════════════════════════════════════════════════════════════════
async function testChatAPI() {
  section('SUITE 5 — API /api/chat (F1 — Tuteur IA)');

  // Test avec un message simple (format attendu par l'API : tableau messages)
  try {
    const res = await fetchTest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Explique-moi la photosynthèse en une phrase.' }
        ],
        userContext: null,
      }),
    }, 30000);

    const json = await res.json().catch(() => null);

    if (res.status === 200 && json?.reply) {
      ok('POST /api/chat → 200 + réponse', `Réponse: "${String(json.reply).substring(0, 80)}…"`);
    } else if (res.status === 401) {
      ok('POST /api/chat → 401 (auth requise)', 'Normal si le chat nécessite un compte');
    } else if (res.status === 200 && json?.message) {
      ok('POST /api/chat → 200', `Message: "${String(json.message).substring(0, 80)}"`);
    } else {
      warn('POST /api/chat', `HTTP ${res.status} — ${JSON.stringify(json)?.substring(0, 150)}`);
    }
  } catch (err) {
    warn('POST /api/chat', `Timeout/erreur: ${err.message}`);
  }

  // Test sans body → doit retourner 400
  try {
    const res = await fetchTest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, 10000);
    if (res.status === 400 || res.status === 422) {
      ok('POST /api/chat body vide → 400/422', 'Validation Zod correcte');
    } else if (res.status === 401) {
      ok('POST /api/chat sans auth → 401', 'Auth requise');
    } else {
      warn('POST /api/chat body vide', `HTTP ${res.status}`);
    }
  } catch (err) {
    warn('POST /api/chat body vide', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 6 — API /api/lessons/generate (validation Zod T4)
// ════════════════════════════════════════════════════════════════
async function testGenerateValidation() {
  section('SUITE 6 — Validation API /api/lessons/generate (Zod)');

  const tests = [
    {
      name: 'Body JSON invalide (pas JSON)',
      body: 'pas du json',
      contentType: 'text/plain',
      expectedStatus: 400,
    },
    {
      name: 'topic manquant → 400',
      body: JSON.stringify({ subject: 'Sciences' }),
      expectedStatus: 400,
    },
    {
      name: 'topic trop court (1 char) → 400',
      body: JSON.stringify({ topic: 'A' }),
      expectedStatus: 400,
    },
    {
      name: 'topic trop long (>200 chars) → 400',
      body: JSON.stringify({ topic: 'A'.repeat(201) }),
      expectedStatus: 400,
    },
  ];

  for (const { name, body, contentType = 'application/json', expectedStatus } of tests) {
    try {
      const res = await fetchTest('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      }, 10000);
      if (res.status === expectedStatus) {
        ok(name, `HTTP ${res.status} ✓`);
      } else {
        warn(name, `HTTP ${res.status} (attendu ${expectedStatus})`);
      }
    } catch (err) {
      fail(name, err.message);
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 7 — Middleware & Auth redirections
// ════════════════════════════════════════════════════════════════
async function testMiddleware() {
  section('SUITE 7 — Middleware (exclusion webhooks Stripe + sessions)');

  // Webhook Stripe — doit répondre 400 (bad signature) PAS 401
  try {
    const res = await fetchTest('/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=fake,v1=fake',
      },
      body: JSON.stringify({ type: 'test' }),
    }, 10000);

    if (res.status === 400) {
      ok('Webhook Stripe → 400 Bad Signature', 'Signature invalide mais route accessible (pas 401)');
    } else if (res.status === 200) {
      warn('Webhook Stripe → 200', 'Inattendu mais pas critique');
    } else if (res.status === 401) {
      fail('Webhook Stripe → 401', 'Le middleware Supabase interfère avec le webhook Stripe !');
    } else if (res.status === 404) {
      warn('Webhook Stripe → 404', 'Route /api/stripe/webhook non trouvée sur ce déploiement');
    } else {
      warn('Webhook Stripe', `HTTP ${res.status}`);
    }
  } catch (err) {
    warn('Webhook Stripe', `Erreur réseau: ${err.message}`);
  }

  // Route API protégée sans auth → 401, PAS redirect 307
  try {
    const res = await fetchTest('/api/quests', { redirect: 'manual' });
    if (res.status === 401) {
      ok('Route protégée /api/quests → 401 (pas 307)', 'Redirection évitée pour les APIs');
    } else if (res.status === 307 || res.status === 302) {
      fail('Route protégée /api/quests → redirect', `HTTP ${res.status} — les APIs ne devraient pas rediriger`);
    } else {
      warn('/api/quests sans auth', `HTTP ${res.status}`);
    }
  } catch (err) {
    warn('/api/quests sans auth', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 8 — Quiz Submit API
// ════════════════════════════════════════════════════════════════
async function testQuizSubmit() {
  section('SUITE 8 — API /api/quiz/submit (intégrité)');

  // Sans auth → 401
  try {
    const res = await fetchTest('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 'fake-id', answers: [0, 1, 2] }),
    }, 10000);

    if (res.status === 401) {
      ok('POST /api/quiz/submit sans auth → 401', 'Accès restreint aux users connectés');
    } else if (res.status === 400) {
      ok('POST /api/quiz/submit sans auth → 400', 'Rejeté (validation ou auth)');
    } else {
      warn('POST /api/quiz/submit sans auth', `HTTP ${res.status}`);
    }
  } catch (err) {
    warn('POST /api/quiz/submit', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 9 — PWA / Manifest
// ════════════════════════════════════════════════════════════════
async function testPWA() {
  section('SUITE 9 — PWA (F6 — Manifest + Meta tags)');

  // Manifest.json
  try {
    const res = await fetchTest('/manifest.json');
    const json = await res.json().catch(() => null);
    if (res.status === 200 && json) {
      const hasName = !!json.name;
      const hasIcons = Array.isArray(json.icons) && json.icons.length > 0;
      const hasDisplay = !!json.display;
      if (hasName && hasIcons && hasDisplay) {
        ok('manifest.json valide', `name="${json.name}", ${json.icons.length} icônes, display="${json.display}"`);
      } else {
        warn('manifest.json incomplet', `name=${hasName}, icons=${hasIcons}, display=${hasDisplay}`);
      }
    } else {
      fail('manifest.json', `HTTP ${res.status}`);
    }
  } catch (err) {
    fail('manifest.json', err.message);
  }

  // Vérifier que l'HTML de la page d'accueil contient le lien manifest
  try {
    const res = await fetchTest('/');
    const html = await res.text();
    if (html.includes('manifest.json') || html.includes('manifest')) {
      ok('Link <meta manifest> présent dans le HTML', 'PWA installable');
    } else {
      warn('Link <meta manifest> absent du HTML', 'PWA peut ne pas être installable');
    }
    if (html.includes('theme-color')) {
      ok('Meta theme-color présente', 'Couleur de barre mobile définie');
    } else {
      warn('Meta theme-color absente', 'Mobile toolbar sans couleur personnalisée');
    }
  } catch (err) {
    warn('Vérification HTML manifest', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  SUITE 10 — Page /progress (F5)
// ════════════════════════════════════════════════════════════════
async function testProgressPage() {
  section('SUITE 10 — Page /progress (F5 — Analytics)');

  try {
    const res = await fetchTest('/progress', { redirect: 'follow' });
    const text = await res.text();

    if (res.status === 200) {
      const hasXP = text.includes('XP') || text.includes('xp');
      const hasStreak = text.includes('streak') || text.includes('Série') || text.includes('jours');
      const hasBadge = text.includes('badge') || text.includes('Badge') || text.includes('trophée');
      ok('/progress charge (200)', `XP=${hasXP}, Streak=${hasStreak}, Badge=${hasBadge}`);
    } else if (res.status === 307 || res.status === 302) {
      ok('/progress redirige (auth requise)', `HTTP ${res.status} → ${res.headers.get('location')}`);
    } else if (res.status === 404) {
      fail('/progress → 404', 'Page non trouvée ! La route n\'a pas été déployée.');
    } else {
      warn('/progress', `HTTP ${res.status}`);
    }
  } catch (err) {
    fail('/progress', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  RÉSUMÉ FINAL
// ════════════════════════════════════════════════════════════════
function printSummary() {
  const total = passed + failed + warned;
  log(`\n${BOLD}${'═'.repeat(55)}${RESET}`);
  log(`${BOLD}  RÉSULTATS FINAUX — EasyLearn Vercel E2E${RESET}`);
  log(`${'═'.repeat(55)}`);
  log(`  ${GREEN}✅ Réussis  : ${passed}${RESET}`);
  log(`  ${YELLOW}⚠️  Avertiss. : ${warned}${RESET}`);
  log(`  ${RED}❌ Échecs   : ${failed}${RESET}`);
  log(`  Total      : ${total} tests`);
  log(`${'═'.repeat(55)}`);

  if (failed > 0) {
    log(`\n${RED}${BOLD}Tests échoués :${RESET}`);
    results.filter(r => r.status === '❌').forEach(r => {
      log(`  ${RED}• ${r.label}${RESET}: ${r.detail}`);
    });
  }

  if (warned > 0) {
    log(`\n${YELLOW}${BOLD}Avertissements :${RESET}`);
    results.filter(r => r.status === '⚠️').forEach(r => {
      log(`  ${YELLOW}• ${r.label}${RESET}: ${r.detail}`);
    });
  }

  log('');
  process.exit(failed > 0 ? 1 : 0);
}

// ════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE
// ════════════════════════════════════════════════════════════════
// ─── Catalogue des suites ────────────────────────────────────────
const ALL_SUITES = [
  { n: 1,  label: 'Pages publiques',            fn: testPublicPages },
  { n: 2,  label: 'Headers de sécurité',        fn: testSecurityHeaders },
  { n: 3,  label: 'API /api/quests',            fn: testQuestsAPI },
  { n: 4,  label: 'Rate-limit invités (IA)',     fn: testGuestRateLimit,  slow: true },
  { n: 5,  label: 'API /api/chat',              fn: testChatAPI },
  { n: 6,  label: 'Validation /api/generate',   fn: testGenerateValidation },
  { n: 7,  label: 'Middleware & Auth',          fn: testMiddleware },
  { n: 8,  label: 'Quiz Submit',               fn: testQuizSubmit },
  { n: 9,  label: 'PWA / Manifest',            fn: testPWA },
  { n: 10, label: 'Page /progress',            fn: testProgressPage },
];

// ════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE
// ════════════════════════════════════════════════════════════════
log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}`);
log(`${BOLD}${CYAN}║   EasyLearn — Tests E2E Vercel Production             ║${RESET}`);
log(`${BOLD}${CYAN}║   URL : ${BASE_URL}${' '.repeat(Math.max(0, 46 - BASE_URL.length))}║${RESET}`);
if (SKIP_AI)   log(`${BOLD}${YELLOW}║   Mode : rapide (--skip-ai, Suite 4 ignorée)          ║${RESET}`);
if (ONLY_SUITE) log(`${BOLD}${YELLOW}║   Mode : suite unique (--suite=${ONLY_SUITE})                     ║${RESET}`);
log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}`);

(async () => {
  const start = Date.now();

  for (const suite of ALL_SUITES) {
    // Filtre par --suite=N
    if (ONLY_SUITE !== null && suite.n !== ONLY_SUITE) continue;
    // Saute les suites lentes si --skip-ai
    if (SKIP_AI && suite.slow) {
      log(`\n${YELLOW}⏭  Suite ${suite.n} (${suite.label}) ignorée (--skip-ai)${RESET}`);
      continue;
    }
    await suite.fn();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log(`\n${DIM}  Durée totale : ${elapsed}s${RESET}`);
  printSummary();
})();

