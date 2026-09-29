# SunuNature — Le réseau africain du vivant

Réseau social naturaliste africain pour observer, identifier et partager les plantes, insectes, oiseaux, mammifères et autres formes de vie. Les observations sont stockées dans PostgreSQL via Prisma; les comptes sont protégés par mot de passe haché et cookie de session httpOnly.

## Fonctionnalités

### Réseau naturaliste
- ✅ Fil communautaire multi-groupes du vivant avec localisation par pays/région
- ✅ Connexion et inscription dédiées
- ✅ Base PostgreSQL relationnelle gérée par Prisma et migrations versionnées

### Core
- ✅ Identification de plantes par photo via Pl@ntNet, enrichie par GBIF
- ✅ Reconnaissance locale des animaux, insectes, plantes et champignons via MobileNet, avec rapprochement taxonomique GBIF (la photo n’est pas envoyée)
- ✅ Détection visuelle de maladies (à confirmer avant traitement)
- ✅ Assistant vocal botanique ( reconnaissance vocale + synthèse vocale)
- ✅ Capture caméra pour identification via le moteur photo
- ✅ Carte interactive des lieux botaniques (Leaflet + PostGIS-ready)
- ✅ Observations naturalistes réelles à proximité (iNaturalist, avec consentement de géolocalisation)
- ✅ Filtre saisonnier (qu'est-ce qui fleurit ce mois-ci)
- ✅ Exposition botanique régionale avec régions d'Afrique

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
- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Prisma ORM + SQLite (PostgreSQL-ready)
- ✅ API Routes : `/api/identify`, `/api/auth`, `/api/locations`, `/api/voice-assistant`, `/api/community`, `/api/gamification`
- ✅ Base de données relationnelle complète (User, Plant, Disease, Location, ScanHistory, Favorite, CommunityPost, GamificationProfile, Reminder)

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

### APIs nécessaires :

| Variable | Description | Obtention |
|----------|-------------|-----------|
| `PLANTNET_API_KEY` | Identification par photo et diagnostic visuel | https://my.plantnet.org/ |
| `OPENWEATHER_API_KEY` | Météo pour rappels intelligents | https://openweathermap.org/api |
| `GOOGLE_MAPS_API_KEY` | Cartographie avancée | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_TRANSLATE_API_KEY` | Traduction vocale | https://cloud.google.com/translate |
| `CLOUDINARY_*` | Stockage d'images | https://cloudinary.com/ |
| `NEXTAUTH_SECRET` | Authentification sécurisée | `openssl rand -base64 32` |

Les plantes sont identifiées par Pl@ntNet avec `PLANTNET_API_KEY`. Le mode « Insectes & animaux » classe l’image sur l’appareil avec MobileNet puis rapproche les étiquettes de GBIF via `/api/identify-life`; la photo ne quitte pas le navigateur. MobileNet reconnaît des catégories ImageNet et peut manquer des espèces africaines rares ou proches.

Le calendrier vivant est calculé par pays à partir des observations publiques de la communauté sur 24 mois. Il mesure l’activité de partage et ne constitue pas une prévision de présence des espèces. Le réseau plantes–insectes repère des co-présences publiques dans le temps et l’espace; il ne démontre pas une pollinisation.

`PLANTNET_API_KEY` est la seule clé indispensable à l’identification botanique spécialisée. Elle est utilisée uniquement par la route serveur `/api/identify` et n'est jamais envoyée au navigateur. Les résultats sont enrichis automatiquement par le référentiel taxonomique ouvert [GBIF](https://www.gbif.org/) (aucune clé nécessaire). Le diagnostic est une aide au triage : confirmez tout traitement, surtout sur une plante alimentaire, auprès d'un professionnel.

## Base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

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
