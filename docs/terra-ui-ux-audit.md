# Audit UI/UX TERRA — état au 29 octobre 2026

## Périmètre vérifié

- Inventaire de l’application Next.js : 154 fichiers dans `src/app` et `src/components`, routes UI et API présentes, navigation, composants d’accueil, biodiversité, identification, observations, missions, profils et catalogues.
- Vérification statique des états de chargement/erreur, des contrôles sans action, du mouvement réduit, des médias et des protections d’authentification déjà présentes.
- Contrôle WCAG automatisé avec axe sur 12 parcours (accueil, identification, missions, catalogues, connexion, inscription, notifications, recherche, observations, fiche espèce, profil et page écosystèmes), en clair et en sombre, bureau (1365 px) et mobile (390 px). Aucun contraste WCAG testé ne remonte de violation et aucun de ces parcours ne déborde horizontalement.
- Compilation de production, ESLint, TypeScript et contrôles HTTP locaux. L’API de santé locale indique une dépendance média indisponible dans l’environnement de test; le service déployé répond « ok » pour base et médias.
- Contrôle en lecture seule de l’API iNaturalist taxonomique de production : HTTP 200, 1 285 résultats annoncés pour le taxon testé. Le serveur local signale aussi que sa base de développement n’a pas la table `api_rate_limits` de la migration existante; aucune migration n’a été lancée depuis l’environnement de travail.

Cet audit n’est pas une certification WCAG de toutes les pages. Les interfaces d’administration, parcours authentifiés, claviers/lecteurs d’écran réels, mesures Core Web Vitals et tests de bout en bout complets restent à vérifier.

## Priorités constatées

| Priorité | Constat | Conséquence | Suite recommandée |
|---|---|---|---|
| P1 | Plusieurs prototypes existent sans être montés dans une page (`RegionalExhibition`, cartes, cartes botaniques et diagnostic). `RegionalExhibition` contient même un gestionnaire sans action et des statistiques/visuels de démonstration. | Risque de présenter une promesse non alimentée par des données réelles si ces prototypes sont branchés tels quels. | Valider les sources et le contrat API, remplacer les données de démonstration, relier les actions, puis seulement publier le parcours. |
| P1 | Les API publiques reposent sur la disponibilité de la base et de services médias/externes. Les contrôles locaux peuvent donc être partiellement dégradés. | Un module peut afficher peu ou aucune donnée malgré une réponse HTTP valide. | Ajouter une surveillance de disponibilité des sources de données, distinguer « zéro donnée » de « source indisponible », et observer les erreurs en production. |
| P2 | `globals.css` contient les tokens et corrections actuels, mais aussi une grande feuille historique avec des règles superposées. | Risque de régression de thème ou de responsive lors d’une modification non ciblée. | Extraire progressivement les styles par domaine avec captures/axe à chaque lot, sans réécriture globale. |
| P2 | La navigation principale et les parcours publics sont testés en bureau/mobile, mais aucune validation complète des flux clavier, lecteurs d’écran, tablette et administration n’a été faite dans cet audit. | Des défauts d’interaction peuvent subsister hors des contrôles axe automatisés. | Ajouter des scénarios manuels et des tests clavier pour menus, filtres, formulaires, modales et opérations administrateur. |
| P2 | Les images sont techniquement cadrées sans découpe sur les parcours contrôlés, mais le chargement des sources externes dépend de leurs serveurs et tailles d’origine. | Lenteur ou image indisponible selon le fournisseur et le réseau. | Mesurer LCP/CLS sur données réelles, choisir les tailles dérivées disponibles, prévoir erreurs/attributions et cache contrôlé. |

## Phases et état

1. **Diagnostic — réalisé, avec limites de périmètre.** Routes et modules inventoriés; priorités ci-dessus. Les tests couvrent des parcours essentiels, pas chaque écran.
2. **Architecture UX — partiellement réalisée.** La navigation publique est cohérente et la page d’accueil relie cinq univers existants. Les parcours spécialisés agriculteurs, apiculteurs et éleveurs ne sont pas encore contextualisés.
3. **Design system — partiellement réalisé.** Les tokens de couleurs/thèmes et styles réutilisés existent; corrections de contraste validées sur 12 parcours. La consolidation de l’historique CSS reste à faire par lots.
4. **Pages principales — réalisée pour les parcours principaux, à approfondir.** Accueil, encyclopédie, identification et fiches espèce ont déjà été retravaillés dans les commits précédents; les contrôles actuels valident notamment accueil, identification, biodiversité et fiche espèce.
5. **Écosystème et communauté — en cours.** `/ecosystemes` expose le calendrier, les co-présences, l’écoute sonore et les alertes locales avec états d’erreur et limites scientifiques explicites. Communauté, observations et missions existent; les prototypes non reliés doivent être traités séparément.
6. **Optimisation — partiellement vérifiée.** Pas de débordement horizontal sur les 12 parcours testés, styles de mouvement réduit présents et chargement écologique annulable avec erreur/réessai. Aucune mesure Lighthouse/Core Web Vitals complète n’a été produite.
7. **Validation — réalisée pour le lot publié.** `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build -- --webpack`, axe sur 12 routes × 2 thèmes × 2 dimensions, vérification de l’API/page en production. Le contrôle local de fumée a obtenu 8/9 : `/api/health` renvoie 503 parce que le stockage média local n’est pas joignable; les huit autres réponses attendues passent. L’environnement local a également une migration `api_rate_limits` non appliquée; l’endpoint taxonomique correspondant a répondu HTTP 200 en production. En production `/api/health` renvoie 200 et `{database:true, media:true}`.

## Lot livré

- Ajout de `/ecosystemes`, accessible depuis l’accueil, avec explication que l’activité observée ne constitue ni une prévision ni une preuve d’interaction écologique.
- Ajout d’états de chargement, erreur, annulation et nouvelle tentative autour du chargement écologique.
- Corrections de contraste des cartes espèces, observation publique et actions principales selon le thème.
- Déploiement Render confirmé : page `/ecosystemes` en HTTP 200, santé de production HTTP 200.

Commits : `0d9919e` et `819ea0b`.
