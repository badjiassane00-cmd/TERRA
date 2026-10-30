# Audit UI/UX TERRA — état au 29 octobre 2026

## Périmètre vérifié

- Inventaire de l’application Next.js : 154 fichiers dans `src/app` et `src/components`, routes UI et API présentes, navigation, composants d’accueil, biodiversité, identification, observations, missions, profils et catalogues.
- Vérification statique des états de chargement/erreur, des contrôles sans action, du mouvement réduit, des médias et des protections d’authentification déjà présentes.
- Contrôle WCAG automatisé avec axe sur 12 parcours (accueil, identification, missions, catalogues, connexion, inscription, notifications, recherche, observations, fiche espèce, profil et page écosystèmes), en clair et en sombre, bureau (1365 px) et mobile (390 px). Aucun contraste WCAG testé ne remonte de violation et aucun de ces parcours ne déborde horizontalement.
- Contrôle WCAG complémentaire sur `/explorer?section=observations`, `/admin` (redirigé vers la connexion sans session) et les états « introuvable » d’une exposition et d’une identification : zéro violation axe et aucun débordement sur les vues testées. Le tableau de bord administrateur authentifié n’a pas été ouvert.
- Contrôle du parcours visiteur : `/explorer` ouvre désormais les observations publiques; la galerie privée redirige toujours vers la connexion. Le parcours public passe axe en clair et en sombre, desktop/mobile.
- Contrôle Chrome du héros d’identification : après retrait de la vidéo décorative, le navigateur ne demande plus le fichier de 8,7 Mo. Sur ce build local headless, le transfert total rapporté pour `/identifier` était de 75 Ko sur desktop et 571 Ko sur mobile; ces valeurs ne sont pas des mesures terrain ni une certification Core Web Vitals.
- Mesure indicative Chrome headless en production sur desktop (`/identifier`) : LCP navigateur 1 768 ms, DOMContentLoaded 1 249 ms, `load` 1 670 ms, 549 Ko transférés et 30 requêtes. C’est une seule navigation synthétique, sans répétition ni réseau mobile simulé; cela ne remplace pas Lighthouse ni les Core Web Vitals terrain. La tentative équivalente mobile a échoué au démarrage du canal Chrome DevTools et n’est pas comptée comme mesure.
- Revue statique des routes d’administration : rôle relu depuis la base pour chaque API, protections ADMIN/SUPER_ADMIN confirmées; page `/admin` redirige sans session. Le tableau authentifié n’a pas pu être exercé sans compte admin de test. Correction UX : ajout d’une action Réessayer quand le chargement initial échoue et amélioration des cibles tactiles/focus visible des sections et du bouton Actualiser.
- La page d’accueil offre maintenant des entrées contextualisées pour cultures/jardinage, pollinisateurs/saisons, pastoralisme et études/observation. Chaque entrée mène à une route existante et nomme ses limites; aucun parcours de suivi de parcelle, de troupeau ou de rucher n’est prétendu disponible.
- Vérification HTTP sur le build local des destinations des entrées contextualisées : `/identifier?mode=disease`, `/ecosystemes` et `/biodiversite?kingdom=Animalia` répondent HTTP 200. `/` répond également HTTP 200. Le smoke test API passe 8/9; seule la santé locale échoue car le stockage média de développement n’est pas disponible.
- Axe exécuté sur l’accueil final en clair et en sombre, en desktop (1365 px) et mobile (390 px) : zéro violation WCAG automatisée et aucun débordement. Le premier passage a détecté cinq contrastes insuffisants dans les nouveaux libellés/liens; leurs couleurs ont été corrigées avant le second passage.
- Compilation de production, ESLint, TypeScript et contrôles HTTP locaux. L’API de santé locale indique une dépendance média indisponible dans l’environnement de test; le service déployé répond « ok » pour base et médias.
- Contrôle en lecture seule de l’API iNaturalist taxonomique de production : HTTP 200, 1 285 résultats annoncés pour le taxon testé. Le serveur local signale aussi que sa base de développement n’a pas la table `api_rate_limits` de la migration existante; aucune migration n’a été lancée depuis l’environnement de travail.

Cet audit n’est pas une certification WCAG de toutes les pages. Les interfaces d’administration, parcours authentifiés, claviers/lecteurs d’écran réels, mesures Core Web Vitals et tests de bout en bout complets restent à vérifier.

## Priorités constatées

| Priorité | Constat | Conséquence | Suite recommandée |
|---|---|---|---|
| P1 | Plusieurs prototypes existent sans être montés dans une page (`RegionalExhibition`, cartes, cartes botaniques et diagnostic). Les regroupements régionaux/spécialités de l’exposition sont inférés de descriptions et doivent être validés. | Risque de présenter des inférences textuelles comme des données scientifiques si ces prototypes sont branchés tels quels. | Valider les sources et le contrat API, utiliser les localités documentées, puis seulement publier le parcours. |
| P1 | Les API publiques reposent sur la disponibilité de la base et de services médias/externes. Les contrôles locaux peuvent donc être partiellement dégradés. | Un module peut afficher peu ou aucune donnée malgré une réponse HTTP valide. | Ajouter une surveillance de disponibilité des sources de données, distinguer « zéro donnée » de « source indisponible », et observer les erreurs en production. |
| P2 | `globals.css` contient les tokens et corrections actuels, mais aussi une grande feuille historique avec des règles superposées. | Risque de régression de thème ou de responsive lors d’une modification non ciblée. | Extraire progressivement les styles par domaine avec captures/axe à chaque lot, sans réécriture globale. |
| P2 | La navigation principale et les parcours publics sont testés en bureau/mobile, mais aucune validation complète des flux clavier, lecteurs d’écran, tablette et administration n’a été faite dans cet audit. | Des défauts d’interaction peuvent subsister hors des contrôles axe automatisés. | Ajouter des scénarios manuels et des tests clavier pour menus, filtres, formulaires, modales et opérations administrateur. |
| P2 | Les images sont techniquement cadrées sans découpe sur les parcours contrôlés, mais le chargement des sources externes dépend de leurs serveurs et tailles d’origine. | Lenteur ou image indisponible selon le fournisseur et le réseau. | Mesurer LCP/CLS sur données réelles, choisir les tailles dérivées disponibles, prévoir erreurs/attributions et cache contrôlé. |

## Phases et état

1. **Diagnostic — réalisé, avec limites de périmètre.** Routes et modules inventoriés; priorités ci-dessus. Les tests couvrent des parcours essentiels, pas chaque écran.
2. **Architecture UX — partiellement réalisée.** La navigation publique est cohérente, l’entrée « Communauté » expose le carnet d’observations sans exiger de compte et la page d’accueil relie cinq univers existants. La galerie et les catalogues restent protégés. Les publics cultures/jardinage, pollinisateurs, pastoralisme et études ont maintenant des entrées explicites vers les outils existants; des espaces métier et des données dédiées restent à concevoir.
3. **Design system — partiellement réalisé.** Les tokens de couleurs/thèmes et styles réutilisés existent; corrections de contraste validées sur 12 parcours. La consolidation de l’historique CSS reste à faire par lots.
4. **Pages principales — réalisée pour les parcours principaux, à approfondir.** Accueil, encyclopédie, identification et fiches espèce ont déjà été retravaillés dans les commits précédents; les contrôles actuels valident notamment accueil, identification, biodiversité et fiche espèce.
5. **Écosystème et communauté — en cours.** `/ecosystemes` expose le calendrier, les co-présences, l’écoute sonore et les alertes locales avec états d’erreur et limites scientifiques explicites. Communauté, observations et missions existent; les prototypes non reliés doivent être traités séparément.
6. **Optimisation — partiellement vérifiée.** Pas de débordement horizontal sur les parcours scannés; le média décoratif de 8,7 Mo a été retiré du chargement de la page d’identification au profit de l’image fixe déjà utilisée en fond. Le transfert navigateur local mesuré est passé de 9 451 Ko à 75 Ko en desktop; la mesure de 571 Ko en mobile vient d’un autre profil de test et n’est donc pas directement comparable. La carte est chargée dynamiquement, le chargement écologique est annulable et réessayable. Aucune mesure Lighthouse/Core Web Vitals de production n’a été produite.
7. **Validation — réalisée pour les lots publiés, à compléter pour l’administration authentifiée.** `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build -- --webpack`, axe sur 12 routes × 2 thèmes × 2 dimensions, vérification de l’API/page en production. Le contrôle local de fumée a obtenu 8/9 : `/api/health` renvoie 503 parce que le stockage média local n’est pas joignable; les huit autres réponses attendues passent. L’environnement local a également une migration `api_rate_limits` non appliquée; l’endpoint taxonomique correspondant a répondu HTTP 200 en production. En production `/api/health` renvoie 200 et `{database:true, media:true}`.

## Lot livré

- Ajout de `/ecosystemes`, accessible depuis l’accueil, avec explication que l’activité observée ne constitue ni une prévision ni une preuve d’interaction écologique.
- Ajout d’états de chargement, erreur, annulation et nouvelle tentative autour du chargement écologique.
- Corrections de contraste des cartes espèces, observation publique et actions principales selon le thème.
- Le lien d’entrée Communauté ouvre le carnet public pour les visiteurs; seuls les espaces personnels gardent la redirection de connexion. Le parcours a été contrôlé en HTTP et axe.
- Réparation du chargement initial du prototype `RegionalExhibition`, retrait du clic sans action sur ses cartes et suppression de sa photo générique de remplacement. Le prototype reste non relié à une page, car ses regroupements régionaux/spécialités doivent être validés sur des données de source avant d’être présentés comme fiables.
- La visionneuse des stories communautaires gère Échap, le maintien du focus dans la boîte de dialogue et le retour du focus à son déclencheur. La compilation et les contrôles statiques passent; le parcours authentifié reste à confirmer avec un compte de test en navigateur.
- Les vidéos de story ne démarrent plus automatiquement; elles gardent leurs commandes natives.
- La vidéo d’ambiance de 8,7 Mo a été retirée de l’interface d’identification : Chrome ne demande plus ce fichier sur desktop ou mobile; l’image fixe existante reste en place.
- Déploiement Render confirmé : page `/ecosystemes` en HTTP 200, santé de production HTTP 200.
- Le tableau admin propose maintenant une nouvelle tentative accessible au clavier lorsque l’API échoue dès l’ouverture; les commandes de section ont un état courant explicite et un focus clavier visible.
- L’accueil propose quatre portes d’entrée contextualisées, dont les descriptions précisent quand l’outil n’est qu’une piste visuelle ou une co-présence et quand le module métier n’existe pas encore.
- L’accueil de production a été revérifié après le déploiement Render du commit `1981e84`; le nouveau bloc de parcours contextualisés est présent dans le HTML servi.

Commits du chantier : `0d9919e`, `819ea0b`, `e4f93e2`, `029c3c5`, `91f9a4b`, `956942b`, `52fd4a6`, `b628ce2`, `2243890`, `0fbb45a`, `1981e84`.

## Addendum — contrôles et corrections après le déploiement du 29 octobre 2026

- Le lot d'identification, de déduplication GBIF et de validation de modération a été publié dans le commit `81c66b6`. En production, `/api/health` répond 200 avec base et médias disponibles; les recherches « Adansonia » et « baobab » retournent respectivement 2 et 10 taxons uniques, sans doublon dans les pages observées.
- Après publication, le smoke test public passe 9/9 contrôles. Le navigateur a contrôlé accueil, biodiversité, identification, communauté, missions et fiche espèce en clair/sombre et en 1365 px/390 px : axe ne signale aucune violation et aucun débordement horizontal n'a été observé.
- Le parcours UICN a révélé un chemin d'API obsolète. La spécification officielle v4 demande une recherche par `genus_name` et `species_name` sur `/api/v4/taxa/scientific_name`; un nouvel adaptateur respecte ce contrat, préfère l'évaluation globale marquée la plus récente, conserve l'échelle et l'année, et traite distinctement les anciennes catégories `LR/lc`, `LR/nt` et `LR/cd`. Des tests unitaires couvrent l'URL, les codes et la sélection des évaluations.
- L'instance Render consultée ne possède pas de `IUCN_API_KEY` : `/api/conservation-status` répond `available:false` avec `reason:no_api_key`. L'intégration corrigée ne peut donc pas encore être validée contre une réponse UICN autorisée. Le badge rend désormais visibles les états d'absence de clé, d'absence d'évaluation et d'indisponibilité du service; le réessai est proposé en cas d'erreur temporaire. Le proxy applique une limite de six requêtes par minute et par adresse quand le fournisseur est configuré.
- Les pages `/mentions-legales` et `/confidentialite` sont toujours absentes. Leur rédaction reste suspendue aux informations exactes de l'éditeur, son adresse et un contact de confidentialité; aucune identité n'a été déduite de la configuration technique.
- Les parcours de création, de modification et de suppression d'observations, ainsi que l'administration authentifiée, restent non vérifiés de bout en bout faute de compte de test. Les vérifications publiques ne remplacent pas ces essais.
- Limites persistantes : aucune certification WCAG manuelle avec lecteur d'écran, aucune mesure répétée des Core Web Vitals terrain et aucune refonte globale de `globals.css`. Ces actions doivent rester graduelles et accompagnées de mesures afin d'éviter les régressions.

## Addendum — identité visuelle TERRA, 30 octobre 2026

- Intégration de l’emblème TERRA fourni : le menu utilise un symbole carré optimisé avec le nom textuel accessible, et le héros de l’accueil présente l’affiche complète sur grand écran. L’affiche est masquée sur mobile pour préserver l’espace du titre et des actions.
- Les icônes 192 px, 512 px, Apple Touch et favicon reprennent le symbole de biodiversité recadré; les fichiers PNG d’installation sont quantifiés pour limiter leur poids. Le visuel complet est livré en WebP.
- Contrôles après intégration : `npm test` (4 fichiers/suites passés), `npm run lint`, `npx tsc --noEmit --incremental false` et `npm run build -- --webpack` réussis. `git diff --check` ne signale pas d’erreur de whitespace.
- Restent à faire sur les autres recommandations : essais de bout en bout des parcours authentifiés et du tableau administrateur avec comptes de test; mesures répétées de performance terrain; validation clavier/lecteur d’écran manuelle; configuration d’une clé UICN; rédaction exacte des pages légales après réception de l’identité et de l’adresse de l’éditeur et du contact confidentialité. Aucun résultat de ces vérifications n’est présumé par le présent lot.

## Addendum — correction du déploiement du logo, 30 octobre 2026

- Le déploiement Render du commit `92ac4c2` a échoué pendant le traitement de `src/app/favicon.ico` : les images PNG embarquées dans le conteneur ICO étaient en mode RGB, alors que Turbopack attend RGBA.
- Le favicon a été régénéré avec des frames 16×16 et 32×32 en RGBA. `file` confirme les deux formats, `npm test` passe (4 fichiers), `npm run build -- --webpack` réussit, et le contrôle `git diff --check` ne signale pas d’erreur.
- Un nouveau déploiement est nécessaire pour servir le logo. La confirmation HTTP Render sera faite après publication de ce correctif.
