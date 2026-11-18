# Audit de sécurité

## Constat critique — mutations Supabase depuis le navigateur

Le schéma permettait aux rôles `anon`/`authenticated` certaines mutations directes et l'exécution de RPC `SECURITY DEFINER` acceptant un identifiant utilisateur. Selon les droits effectivement appliqués sur la base, cela pouvait permettre de modifier des données de progression ou d'accorder des crédits sans passer par les vérifications serveur.

**Correctif préparé dans le dépôt :**

- `supabase/migrations/20261117_restrict_client_writes.sql` révoque les mutations sur les tables sensibles et l'exécution des RPC pour `PUBLIC`, `anon` et `authenticated`.
- `supabase/schema.sql` applique les mêmes restrictions aux nouvelles installations.
- Les handlers sensibles écrivent avec le client service-role et dérivent l'identité du contexte Auth; les entrées ne choisissent pas l'utilisateur à modifier.
- Les données de démonstration importées sont identifiées et ne rapportent pas d'XP au quiz.

**État : non déployé.** La migration n'a pas été exécutée et aucune requête n'a vérifié les privilèges de la base réelle. La production doit être considérée à risque jusqu'à l'application et la vérification de cette migration.

## Autres constats confirmés

### Injection HTML dans les e-mails de feedback — corrigée dans le code

`app/api/feedback/route.ts` insérait les champs publics directement dans le HTML d'un e-mail. Les entrées sont maintenant validées par Zod, limitées en taille, et échappées dans le HTML; l'adresse de réponse est validée et les erreurs du fournisseur ne sont plus renvoyées au demandeur. Un test vérifie l'échappement et le rejet d'un e-mail mal formé.

La route reste publique et ne dispose pas de limitation distribuée des envois. Il faut configurer une protection anti-abus durable avant d'exposer l'envoi e-mail à un trafic important.

### Quotas invités contournables — risque résiduel élevé

`app/api/lessons/generate/route.ts` stocke son compteur IP dans une `Map` mémoire et accepte un cookie `guest_rl` encodé en Base64 sans signature. Un redémarrage ou une autre instance Vercel ne partage pas cette map; le cookie peut être modifié. `/api/lessons/continue` n'applique pas ce contrôle. Ce dispositif n'est pas une limite de coût fiable.

### Génération et facturation non atomiques — risque résiduel élevé

Les routes vérifient les droits, génèrent et enregistrent une leçon, puis tentent de consommer le crédit. L'échec de consommation est absorbé après journalisation, donc une requête peut apparaître réussie alors que le quota n'a pas été mis à jour. Les requêtes concurrentes peuvent également passer une vérification de quota avant qu'une autre ne consomme. Une opération SQL transactionnelle de réservation/enregistrement est nécessaire pour garantir l'invariant.

### Import de démo — limite de corps incomplète

`/api/sync-demo` s'appuie sur l'en-tête `Content-Length` pour refuser les corps de plus de 1 Mo, puis valide la structure et le nombre d'éléments. Cet en-tête peut manquer; le contenu JSON imbriqué n'a pas de taille maximale côté schéma. Appliquer une limite réelle au flux de lecture et borner aussi les objets imbriqués.

## Dépendances

Après la migration majeure approuvée, `npm audit` rapporte 17 vulnérabilités élevées et aucune critique. Elles sont limitées aux dépendances de développement observées, dont les chaînes ESLint/TypeScript ESLint et Vitest/Vite, ainsi que des paquets transitifs. Les solutions proposées par npm incluent des rétrogradations majeures de `eslint-config-next` et Vitest; elles n'ont pas été appliquées. Ce résultat ne remplace pas une revue des avis ni la vérification des versions corrigées.

`npm audit --omit=dev` ne rapporte aucune vulnérabilité dans les dépendances de production.

## Vérification de mise en production

1. Déployer d'abord le code serveur compatible avec les nouveaux droits.
2. Appliquer ensuite la migration à Supabase, après sauvegarde et vérification des objets ciblés.
3. Vérifier les permissions effectives des tables et fonctions avec des rôles `anon`, `authenticated` et `service_role`.
4. Tester inscription, onboarding, quiz, génération, tickets publicitaires et publicité avec des comptes de test.
5. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au bundle client.

Ces opérations de production n'ont pas été effectuées pendant l'audit.
