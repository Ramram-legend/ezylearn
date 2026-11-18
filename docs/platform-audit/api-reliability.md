# API et fiabilité

## Protections déjà présentes

- Plusieurs routes valident leur JSON avec Zod, dont génération, profil, quiz et synchronisation des données de démonstration.
- La soumission de quiz vérifie que la leçon appartient à l'utilisateur connecté, masque les bonnes réponses avant la soumission et refuse les quiz importés.
- Les mutations administratives sont filtrées par l'identifiant issu de la session serveur.
- Les erreurs de lecture/écriture critiques dans `lib/credits.ts` et `lib/gamification.ts` sont maintenant vérifiées au lieu d'être traitées comme des résultats valides.
- Les bonnes réponses ne sont pas renvoyées dans la réponse de génération de leçon.

## Risques et améliorations

| Priorité | Observation | Recommandation |
|---|---|---|
| P1 | Les opérations génération → insertion → consommation de crédit sont séparées et l'échec de consommation est ignoré. | Remplacer le flux par une RPC transactionnelle avec réservation et résultat explicite. |
| P1 | Le quota invité en mémoire/cookie n'est ni distribué ni signé; la continuation n'est pas limitée. | Utiliser un compteur serveur durable avec limite par utilisateur/IP et appliquer le contrôle aux deux routes. |
| P1 | `/api/sync-demo` traite le corps avant de garantir une limite réelle de lecture; `content` accepte un objet arbitraire. | Limiter le flux du corps et borner la profondeur/taille des structures. |
| P2 | La route de continuation s'appuie sur RLS pour isoler la lecture de la leçon et ignore certaines erreurs de lecture. | Ajouter un filtre explicite `user_id` et différencier une leçon absente d'une erreur DB. |
| P2 | Les tentatives de quiz peuvent ajouter de l'XP à chaque soumission; seule la progression « première complétion » est distinguée. | Confirmer la règle produit; si l'XP est unique, faire respecter l'idempotence dans la base. |
| P2 | Le feedback est validé mais public et sans limitation d'envoi distribuée. | Ajouter un mécanisme anti-abus durable et des limites opérationnelles. |

## État des tests de routes

Les tests ciblés de génération, de quiz, de crédits et de feedback passent. La couverture ne simule pas encore l'application des privilèges PostgreSQL ou les transactions de production; ces garanties nécessitent des tests d'intégration contre une base de test Supabase/Postgres.
