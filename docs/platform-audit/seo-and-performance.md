# SEO et performance

## SEO présent dans le dépôt

- Métadonnées de base, Open Graph et Twitter sont configurés dans `app/layout.tsx`.
- La page d'accueil expose des données structurées `SoftwareApplication`.
- `app/robots.ts` et `app/sitemap.ts` fournissent les routes correspondantes.
- Le sitemap ne référence que la page publique d'accueil; les routes privées sont bloquées et marquées `noindex` par le middleware.

La présence des balises ne garantit pas l'indexation ni un classement. Aucune donnée Google Search Console ou mesure d'indexation réelle n'a été consultée pour cet audit.

## Taille observée au build

Le build local rapporte les tailles First Load JS suivantes : leçon dynamique 323 kB, tableau de bord 199 kB, onboarding 179 kB, profil 182 kB, accueil 174 kB. Ces tailles signalent des candidates à l'analyse de bundle, mais ne remplacent pas des mesures Core Web Vitals sur des sessions réelles.

Webpack a également signalé la sérialisation de chaînes volumineuses (~106 kB et ~254 kB) dans son cache. Aucun profilage de runtime, de requêtes réseau, d'images ou de cache n'a été réalisé.

## Actions recommandées

- Vérifier propriété du domaine et sitemap dans Google Search Console, puis suivre couverture et requêtes réelles.
- Ajouter des pages publiques utiles et indexables uniquement si elles correspondent au produit; garder les espaces privés hors index.
- Mesurer LCP, INP et CLS sur mobile, puis analyser le bundle de la page leçon avant toute optimisation.
- Vérifier la stratégie de cache des appels IA, images, API et ressources statiques avec des données de trafic.
