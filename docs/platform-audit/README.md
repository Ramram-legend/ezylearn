# Audit de la plateforme EzyLearn

## Résumé

L'audit du snapshot local a confirmé un risque critique dans les droits d'écriture Supabase : plusieurs tables de progression, de crédits et de leçons acceptaient des mutations directes par les rôles navigateur, et des RPC `SECURITY DEFINER` sensibles étaient exécutables par ces rôles. Le correctif ajoute une migration de révocation et fait passer les mutations concernées par le client serveur après vérification de l'utilisateur. **La migration n'a pas été appliquée à Supabase et le correctif n'a pas été déployé : la production n'est donc pas considérée comme corrigée.**

Un second problème confirmé permettait d'injecter du HTML dans l'e-mail de feedback. Les champs sont désormais validés et échappés avant insertion dans le HTML. Les tests repassent, mais des risques de cohérence des crédits, de quotas invités et des dépendances restent ouverts.

## État des vérifications

| Vérification | Résultat |
|---|---|
| TypeScript | Réussi |
| Tests Vitest | 93 tests réussis sur 11 fichiers |
| Build Next.js | Réussi avec des valeurs publiques Supabase factices fournies uniquement au processus de build |
| Lint | `npm run lint` : réussi, 0 erreur et 28 avertissements |
| `npm audit` | 17 vulnérabilités élevées, aucune critique; elles concernent les dépendances de développement. `npm audit --omit=dev` : aucune vulnérabilité |
| Migration / politiques en production | Non vérifiées sur la base distante; migration non appliquée |
| Déploiement | Aucun déploiement effectué pour cet audit |

Le build n'a effectué aucune vérification de configuration ou de données de production. Les valeurs Supabase factices n'ont pas été enregistrées dans le dépôt.

## Rapports

- [Architecture et données](architecture-and-data.md)
- [Sécurité](security.md)
- [API et fiabilité](api-reliability.md)
- [Interface et accessibilité](frontend-accessibility.md)
- [SEO et performance](seo-and-performance.md)
- [Tests, livraison et dépendances](quality-dependencies.md)
- [Feuille de route priorisée](prioritized-roadmap.md)

## Limites

L'audit porte sur le code et la configuration présents dans ce worktree. Il ne comprend ni test d'intrusion sur la production, ni inspection de la configuration réelle du projet Supabase ou Vercel, ni mesure réelle de trafic, de Core Web Vitals ou d'indexation Google. Le dépôt contenait déjà des modifications d'interface, de SEO et des dépôts de skills clonés; ces changements préexistants ont été préservés.
