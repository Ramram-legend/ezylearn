# EasyLearn — Backend

Backend de la plateforme **EasyLearn** (Education Smart) : profils apprenants, generation de lecons par IA (Claude), quiz, XP, streaks et badges.

Construit selon le plan de developpement gratuit du CDC (section 4) : **Next.js 14 (App Router / Route Handlers) + Supabase (Postgres + Auth) + API Claude**, deployable gratuitement sur Vercel + Supabase.

> Perimetre : ce livrable couvre le **backend** (API + base de donnees + integration IA). Le prototype front-end `easylearn_v2.html` deja existant peut etre branche dessus (voir [« Brancher le prototype existant »](#brancher-le-prototype-existant)).

---

## 1. Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Serveur | Next.js 14, Route Handlers (`app/api/**/route.ts`), TypeScript | Deploiement gratuit sur Vercel, colocalisable avec un futur front Next.js |
| Base de donnees | Supabase (Postgres) + Row Level Security | Gratuit jusqu'a 500 Mo / 50k users, auth incluse |
| Authentification | Supabase Auth (OAuth Google/Apple/Microsoft géré côté Supabase) | Le backend lit la session via cookies, ne gere pas les mots de passe |
| IA generative | API Anthropic (`claude-sonnet-5`) | Meilleur compromis vitesse/qualite/cout pour de la generation de contenu structure a volume eleve |
| Validation | Zod | Validation stricte des entrees de chaque route |

## 2. Structure du projet

```
easylearn-backend/
├── app/api/
│   ├── interests/route.ts        GET  liste des centres d'interet (onboarding)
│   ├── profile/route.ts          GET/POST profil (age, interets, plan)
│   ├── lessons/
│   │   ├── generate/route.ts     POST generation IA d'une lecon
│   │   ├── [id]/route.ts         GET  une lecon (sans les reponses du quiz)
│   │   └── history/route.ts      GET  historique des lecons
│   ├── quiz/submit/route.ts      POST correction du quiz + XP + streak + badges
│   ├── dashboard/route.ts        GET  agrege stats + profil + suggestions
│   └── badges/route.ts           GET  catalogue des badges + statut obtenu
├── lib/
│   ├── supabase/{client,server,admin}.ts   clients Supabase (browser / route handler / service role)
│   ├── anthropic.ts              appel Claude + prompt + validation du JSON genere
│   ├── gamification.ts           age_group, calcul XP, streaks, attribution des badges
│   ├── plans.ts                  limites quotidiennes de generation par plan
│   ├── suggestions.ts            suggestions de sujets selon les centres d'interet
│   └── api-utils.ts              auth helper + reponses d'erreur standardisees
├── supabase/schema.sql           schema complet (tables, RLS, triggers, seed badges/interets)
├── types/database.ts             types partages (Profile, Lesson, UserStats, Badge, ...)
├── middleware.ts                 rafraichissement de session Supabase
└── .env.example
```

## 3. Installation

### 3.1 Creer les comptes gratuits

1. Un projet sur [supabase.com](https://supabase.com) (gratuit)
2. Une cle API sur [console.anthropic.com](https://console.anthropic.com/settings/keys)
3. (Pour le deploiement) un compte [vercel.com](https://vercel.com)

### 3.2 Base de donnees

Dans Supabase → **SQL Editor**, coller et executer tout le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Ce script cree :
- les tables `profiles`, `lessons`, `quiz_attempts`, `user_stats`, `badges`, `user_badges`, `interest_catalog`
- toutes les policies RLS (chaque utilisateur ne voit que ses propres donnees)
- un trigger qui initialise automatiquement `user_stats` a la creation d'un profil
- les donnees de depart : 12 centres d'interet + 6 badges

Dans Supabase → **Authentication → Providers**, active Google / Apple / Microsoft selon les besoins (cf. CDC, etape 1 du parcours utilisateur).

### 3.3 Variables d'environnement

```bash
cp .env.example .env.local
```

Renseigner dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
- `ANTHROPIC_API_KEY` (console Anthropic)

### 3.4 Lancer en local

```bash
npm install
npm run type-check   # verification TypeScript (deja validee lors de la creation de ce projet)
npm run dev           # http://localhost:3000
```

### 3.5 Deployer

```bash
vercel deploy
```
Puis renseigner les memes variables d'environnement dans Vercel → Project Settings → Environment Variables.

---

## 4. Documentation des endpoints

Toutes les routes (sauf `/api/interests`) exigent une session Supabase valide (cookie envoye automatiquement par le SDK client Supabase depuis le front-end). Sans session : `401`.

### `GET /api/interests`
Catalogue des 12 centres d'interet (id, label, icone). Public.

### `GET /api/profile`
Profil de l'utilisateur connecte. `404` si l'onboarding n'a pas encore ete fait.

### `POST /api/profile`
Cree/met a jour le profil (onboarding).
```json
{ "display_name": "Sara", "age": 14, "interests": ["gaming", "space", "music"] }
```
`age` : 5–25. `interests` : 2 a 8 elements. Calcule automatiquement `age_group`.

### `POST /api/lessons/generate`
Genere une lecon personnalisee via Claude (SVG anime + explication + fun fact + quiz de 3 questions).
```json
{ "topic": "La photosynthese", "subject": "Sciences", "level": "Intermediaire" }
```
- Applique la limite quotidienne du plan (5/jour en `gratuit`, illimite sinon).
- La reponse **ne contient jamais** les bonnes reponses du quiz (`correct_index` reste cote serveur).
- Erreurs possibles : `404` (profil manquant), `429` (quota atteint), `502` (echec de generation IA apres 3 tentatives).

### `GET /api/lessons/:id`
Relit une lecon deja generee (memes garanties : pas de reponses correctes exposees).

### `GET /api/lessons/history?limit=20`
Historique des lecons (id, sujet, matiere, date), le plus recent en premier.

### `POST /api/quiz/submit`
Corrige le quiz cote serveur, met a jour XP/streak/compteurs, attribue les badges eventuellement debloques.
```json
{ "lessonId": "uuid-de-la-lecon", "answers": [1, 2, 0] }
```
Reponse :
```json
{
  "score": 2, "total": 3, "xpEarned": 40, "isPerfect": false,
  "correctAnswers": [1, 2, 1],
  "stats": { "total_xp": 320, "current_streak": 4, "...": "..." },
  "newBadges": [ { "code": "first_lesson", "label": "Premiere Lecon", "icon": "📖" } ]
}
```
XP : `score × 20`, `+30` bonus si score parfait (logique reprise du prototype). Une nouvelle tentative sur la meme lecon compte pour `quizzes_completed` mais pas une seconde fois pour `lessons_completed`.

### `GET /api/dashboard`
Agrege `profile`, `stats`, `recentLessons` (5 dernieres) et `suggestions` (3 sujets, selon les centres d'interet et l'historique).

### `GET /api/badges`
Catalogue des 6 badges avec `earned` (bool) et `earned_at` pour l'utilisateur connecte.

---

## 5. Hypotheses et choix de conception

- **Next.js API routes plutot que Fastify/FastAPI separes** : le CDC propose les deux options ; celle-ci correspond au « plan de developpement gratuit » (section 4 de la conversation) deja documente avec des commandes concretes, et evite une deuxieme infrastructure a heberger.
- **Correction du quiz cote serveur** : les `correct_index` ne sont jamais envoyes au client avant la soumission des reponses, pour eviter qu'ils soient visibles dans les outils reseau du navigateur.
- **XP et badges** : logique d'XP alignee sur le prototype (`score*20 + bonus 30`). Le catalogue de badges est etendu au-dela des 3 badges du prototype (ajout de paliers de streak et de nombre de lecons) pour repondre a l'etape « Mettre en place le systeme de gamification complet » des prochaines etapes du CDC.
- **Suggestions** : mapping statique interet → sujets (fichier `lib/suggestions.ts`), facilement remplacable plus tard par un appel Claude si vous voulez des suggestions entierement dynamiques.
- **Rate limiting** : seule la limite « generations/jour » du plan Gratuit est implementee. La limite « 3 matieres » et le controle parental du plan Famille ne sont pas encore geres — a ajouter selon vos priorites.

## 6. Prochaines etapes suggerees

- [ ] Brancher un vrai front-end (adapter `easylearn_v2.html` ou construire les pages Next.js) sur ces endpoints
- [ ] Ajouter la limite « 3 matieres » et le controle parental (plan Famille)
- [ ] Endpoint(s) d'administration pour le plan Etablissement (comptes multiples, API dediee)
- [ ] Application mobile React Native consommant la meme API
- [ ] Tests automatises (unitaires sur `lib/gamification.ts`, integration sur les routes)

## Brancher le prototype existant

Le prototype `easylearn_v2.html` gere son propre `state` en JavaScript pur (age, interets, topic, quiz...). Pour le relier a ce backend, remplacer les mutations locales de `state` par des appels `fetch()` vers ces routes, par exemple :

```js
// A la place de la logique locale de renderLoading()/startLoading() :
const res = await fetch('/api/lessons/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: state.topic })
});
const { lesson } = await res.json();
// lesson.content.svg, lesson.content.explanation, lesson.quiz (sans correct_index) ...
```

Cela demande aussi d'ajouter le SDK Supabase cote client (`@supabase/ssr`, `createBrowserClient`) pour gerer la connexion OAuth avant d'appeler ces routes.
