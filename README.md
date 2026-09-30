# TERRA — Le réseau mondial du vivant

Réseau social naturaliste international pour observer, identifier et partager les plantes, insectes, oiseaux, mammifères et autres formes de vie. Les observations sont stockées dans MySQL via Prisma et les photos utilisateur dans un stockage objet S3 compatible; les comptes sont protégés par mot de passe haché et cookie de session httpOnly.

## Fonctionnalités

### Réseau naturaliste
- ✅ Fil communautaire multi-groupes du vivant avec localisation par pays/région
- ✅ Connexion et inscription dédiées
- ✅ Base MySQL relationnelle gérée par Prisma et migrations versionnées; médias servis depuis un bucket MinIO privé

### Core
- ✅ Identification de plantes par photo via Pl@ntNet, enrichie par GBIF
- ✅ Reconnaissance locale des animaux, insectes, plantes et champignons via MobileNet, avec rapprochement taxonomique GBIF (la photo n’est pas envoyée)
- ✅ Détection visuelle de maladies (à confirmer avant traitement)
- ✅ Assistant vocal botanique ( reconnaissance vocale + synthèse vocale)
- ✅ Capture caméra pour identification via le moteur photo
- ✅ Carte interactive des lieux botaniques (Leaflet + PostGIS-ready)
- ✅ Observations naturalistes réelles à proximité (iNaturalist, avec consentement de géolocalisation)
- ✅ Filtre saisonnier (qu'est-ce qui fleurit ce mois-ci)
- ✅ Exposition botanique mettant en avant les écosystèmes régionaux

### Expérience utilisateur
- ✅ Design "herbier" moderne : palette claire, typo Fraunces, bordures fines
- ✅ Animations Framer Motion (scroll, hover, transitions)
- ✅ Immersion 3D (Three.js / React Three Fiber) en arrière-plan
- ✅ Jauge de confiance visuelle avec callouts sur photo
- ✅ Historique comparatif des scans avec before/after traitement
- ✅ Mode hors-ligne via Service Worker

### Engagement
- ✅ Système de gamification (points, niveaux, badges, streaks, défis quotidiens)
- ✅ Communauté botanique (posts, likes, partages)
- ✅ Rappels intelligents (arrosage, fertilisation, taille, ensoleillement)
- ✅ Notifications navigateur

### Technique
- ✅ Next.js 16 + TypeScript + Tailwind CSS
- ✅ Prisma ORM + MySQL 8 + MinIO (API S3 compatible)
- ✅ API Routes : `/api/identify`, `/api/auth`, `/api/locations`, `/api/voice-assistant`, `/api/community`, `/api/gamification`
- ✅ Base de données relationnelle MySQL complète et stockage privé des images

## Installation

```bash
cd botanique-app
npm install
```

## Configuration des APIs

Copiez `.env.example` vers `.env.local` et remplissez les clés :

```bash
cp .env.example .env.local
```

### Variables de configuration :

| Variable | Description | Obtention |
|----------|-------------|-----------|
| `PLANTNET_API_KEY` | Identification par photo et diagnostic visuel | https://my.plantnet.org/ |
| `OPENWEATHER_API_KEY` | Météo pour rappels intelligents | https://openweathermap.org/api |
| `GOOGLE_MAPS_API_KEY` | Cartographie avancée | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_TRANSLATE_API_KEY` | Traduction vocale | https://cloud.google.com/translate |
| `MEDIA_S3_*` | Stockage des photos dans MinIO/S3 | Voir la configuration ci-dessous |
| `JWT_SECRET` | Authentification sécurisée TERRA | `openssl rand -base64 32` |

Les plantes sont identifiées par Pl@ntNet avec `PLANTNET_API_KEY`. Le mode « Insectes & animaux » classe l’image sur l’appareil avec MobileNet puis rapproche les étiquettes de GBIF via `/api/identify-life`; la photo ne quitte pas le navigateur. MobileNet reconnaît des catégories ImageNet et peut manquer certaines espèces rares ou proches.

Le calendrier vivant est calculé par pays à partir des observations publiques de la communauté sur 24 mois. Il mesure l’activité de partage et ne constitue pas une prévision de présence des espèces. Le réseau plantes–insectes repère des co-présences publiques dans le temps et l’espace; il ne démontre pas une pollinisation. Les alertes de proximité ne s’appuient que sur les observations publiques géolocalisées des 30 derniers jours et ne signalent pas l’absence d’espèces.

`PLANTNET_API_KEY` est la seule clé indispensable à l’identification botanique spécialisée. Elle est utilisée uniquement par la route serveur `/api/identify` et n'est jamais envoyée au navigateur. Les résultats sont enrichis automatiquement par le référentiel taxonomique ouvert [GBIF](https://www.gbif.org/) (aucune clé nécessaire). Le diagnostic est une aide au triage : confirmez tout traitement, surtout sur une plante alimentaire, auprès d'un professionnel.

### Sons de la nature

L’interface permet d’enregistrer ou d’importer un court audio. Pour obtenir les propositions d’espèces, configurez un service d’analyse auto-hébergé compatible avec `POST multipart/form-data` contenant `audio` (et éventuellement `latitude`/`longitude`). La réponse JSON doit contenir `species` ou `results`, un tableau avec des champs comme `name`, `scientificName`, `commonName` et `confidence`. Configurez `SOUND_IDENTIFICATION_API_URL` et, si nécessaire, `SOUND_IDENTIFICATION_API_KEY`. TERRA relaie l’audio aux utilisateurs connectés et ne l’enregistre pas dans sa base; vérifiez les règles de conservation du fournisseur du modèle.

Les brouillons de publication photo hors connexion sont conservés sur l’appareil (deux au maximum), puis renvoyés automatiquement au retour du réseau et de la session utilisateur. Une clé idempotente évite les doublons si la réponse du serveur s’est perdue; appliquez la nouvelle migration Prisma après mise à jour.

## Base MySQL et médias MinIO

Le dépôt utilise maintenant MySQL 8.4 et un stockage S3 compatible pour les images. Lancer MySQL localement :

```bash
docker compose up -d mysql
```

Configurer `.env.local` avec l’URL MySQL `mysql://terra:terra-local-password@127.0.0.1:3309/terra` et les variables `MEDIA_S3_*` de votre serveur MinIO. TERRA utilise un bucket privé et sert les images publiques par ses propres routes, tandis que les images personnelles exigent la session de leur propriétaire. Aucun serveur MinIO local n’est inclus : l’image officielle n’est actuellement pas récupérable depuis les registres testés et le dépôt amont est archivé; raccordez un serveur MinIO que vous gérez ou choisissez un autre stockage S3 compatible avant l’usage des photos.

Les migrations PostgreSQL historiques sont conservées dans `prisma/migrations-postgresql`. La nouvelle migration MySQL est indépendante. Avant de remplacer `DATABASE_URL`, gardez sa valeur PostgreSQL dans `LEGACY_POSTGRES_URL`, puis configurez la cible MySQL dans `DATABASE_URL` et lancez les commandes dans cet ordre :

```bash
npm run prisma:generate
npm run db:deploy
CONFIRM_POSTGRES_TO_MYSQL=yes npm run db:transfer:mysql
# Après avoir configuré et démarré MinIO
npm run media:externalize
```

Le transfert ne modifie pas PostgreSQL et s’arrête si la cible MySQL contient déjà des lignes. Les photos déjà intégrées restent visibles dans MySQL tant que MinIO n’est pas configuré. `npm run media:externalize` les envoie ensuite vers le bucket privé, puis TERRA les sert via ses routes publiques ou par la session de leur propriétaire.

### Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations en développement
npm run prisma:migrate

# Déployer les migrations validées
npm run db:deploy

# Seed la base de données
npm run prisma:seed

# Ouvrir Prisma Studio (GUI)
npm run prisma:studio
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Build production

```bash
npm run build
npm start
```

## Structure du projet

```
botanique-app/
├── prisma/
│   ├── schema.prisma          # Schéma complet
│   ├── migrations/             # Migrations SQL
│   └── seed.ts                 # Données initiales
├── src/
│   ├── app/
│   │   ├── api/                # API Routes
│   │   │   ├── identify/       # Pl@ntNet + GBIF
│   │   │   ├── identify-life/  # Enrichissement taxonomique sans photo
│   │   │   ├── auth/           # Auth + JWT
│   │   │   ├── locations/      # Lieux botaniques
│   │   │   ├── voice-assistant/# Assistant vocal
│   │   │   ├── community/      # Posts communauté
│   │   │   └── gamification/   # Points/badges
│   │   ├── globals.css         # Styles herbier
│   │   ├── layout.tsx          # Fonts (Geist + Fraunces)
│   │   └── page.tsx            # App principale
│   └── components/
│       ├── three/              # Arrière-plan 3D
│       ├── map/                # Carte Leaflet
│       ├── voice/              # Assistant vocal
│       ├── ar/                 # Réalité augmentée
│       ├── gamification/       # Points/badges/défis
│       ├── community/          # Feed communautaire
│       └── notifications/      # Rappels intelligents
└── public/
    └── sw.js                   # Service Worker offline
```

## Public cible

- Universités (herbier numérique, pédagogie)
- Pépinières et commerçants (outil d'identification/conseil)
- Grand public (usage gratuit)

## Licence

MIT
