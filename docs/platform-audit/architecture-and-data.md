# Architecture et données

## Système observé

- Application Next.js 16 App Router avec React 18 et TypeScript. Next.js 16 prend encore React 18 en charge, mais le marque comme déprécié en vue de Next.js 17.
- Supabase fournit Postgres, l'authentification par cookies et les politiques RLS.
- Les handlers HTTP sont dans `app/api/**/route.ts`.
- La génération de cours appelle DeepSeek depuis `lib/ai.ts`; le dépôt contient aussi des intégrations Anthropic, Stripe et Resend.
- Tailwind CSS 4 et Lucide sont utilisés pour l'interface.
- Le déploiement cible Vercel, mais ce rapport ne valide pas les paramètres du projet distant.

## Flux de données sensibles

1. Supabase Auth fournit l'identité au serveur via `getAuthContext()`.
2. Les données propres à l'utilisateur sont normalement lues avec le client Supabase de session.
3. Les écritures de profil, de cours, de tentatives de quiz, de statistiques et de crédits passent maintenant par `createAdminClient()` dans les handlers concernés.
4. Les routes serveur doivent limiter chaque mutation à `auth.userId`, car le client service-role contourne RLS.

`app/api/profile/route.ts`, `app/api/quiz/submit/route.ts`, `app/api/lessons/generate/route.ts`, `app/api/lessons/continue/route.ts` et `app/api/sync-demo/route.ts` ont été ajustés dans ce sens. La migration SQL retire les écritures navigateur sur les tables sensibles tout en conservant les colonnes de profil nécessaires au callback d'inscription.

## Conception et cohérence

- Les RPC de crédits utilisent des fonctions `SECURITY DEFINER`; le schéma et la migration leur fixent un `search_path` vide et réservent leur exécution à `service_role`.
- La génération vérifie le quota, appelle le fournisseur IA, insère le cours puis consomme le crédit. Ces étapes ne sont pas transactionnelles; la consommation échouée est actuellement journalisée et ignorée dans les handlers de génération.
- Le calcul de progression du quiz lit les données puis écrit tentative et statistiques en plusieurs opérations; une défaillance intermédiaire peut laisser des mises à jour partielles.
- Les politiques RLS des tables sont lisibles dans `supabase/schema.sql`; elles n'ont pas été comparées à la configuration réelle de Supabase.

## Documentation du dépôt

Le `README.md` à la racine décrit encore un backend prototype, Claude et une structure de fichiers qui ne correspondent pas entièrement à l'application actuelle (Next.js complet, DeepSeek, interface active). Il faut le remettre à jour avant d'en faire la procédure d'installation ou d'exploitation officielle.
