# Feuille de route priorisée

## P0 — Bloquer la manipulation de données et déployer le correctif

1. Revoir la migration `supabase/migrations/20261117_restrict_client_writes.sql` avec une base de test.
2. Déployer les handlers qui écrivent via le client service-role et contraignent chaque mutation à l'utilisateur authentifié.
3. Appliquer la migration après le déploiement, puis vérifier les privilèges de tables et fonctions avec les rôles navigateur et serveur.
4. Exécuter un parcours de fumée: inscription, onboarding, génération, quiz, crédits publicitaires et import de données de démonstration.

**Le code et la migration sont préparés, mais aucune étape de production n'a été exécutée.**

## P1 — Fiabilité des coûts et des écritures

- Rendre génération, réservation de quota et enregistrement transactionnels et idempotents; ne pas renvoyer un succès lorsque la consommation échoue.
- Remplacer le quota invité mémoire/cookie par un mécanisme durable signé ou serveur et l'appliquer à `/api/lessons/continue`.
- Limiter la taille réelle des requêtes, en particulier le corps de `/api/sync-demo`.
- Ajouter une limitation persistante et une surveillance aux envois de feedback.
- Couvrir ces garanties par des tests d'intégration Postgres/RLS.

## P1 — Dépendances et compatibilité

La migration majeure vers Next.js 16.4.6, Vitest 5.1.0 et Zod 4.6.7 est faite et validée localement. Évaluer React 19 avant Next.js 17; examiner les 17 alertes élevées des dépendances de développement sans accepter aveuglément les rétrogradations proposées par npm.

## P2 — Qualité produit et visibilité

- Réduire les 28 avertissements ESLint et rendre le lint bloquant en CI.
- Actualiser le README racine pour le produit réel, ses routes et son fournisseur IA.
- Mesurer l'accessibilité et les Core Web Vitals sur les parcours principaux.
- Configurer Search Console et suivre indexation, sitemap et couverture réelle.
- Analyser le bundle des pages leçon et tableau de bord à partir de mesures, pas seulement des tailles de build.
