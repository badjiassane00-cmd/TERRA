# TERRA — Le réseau mondial du vivant

Réseau social naturaliste international pour observer, identifier et partager les plantes, insectes, oiseaux, mammifères et autres formes de vie. Les observations sont stockées dans MySQL via Prisma et les photos utilisateur dans un stockage objet S3 compatible; les comptes sont protégés par mot de passe haché et cookie de session httpOnly.

## Fonctionnalités

### Réseau naturaliste
- ✅ Fil communautaire multi-groupes du vivant avec localisation par pays/région
- ✅ Connexion et inscription dédiées
- ✅ Base MySQL relationnelle gérée par Prisma et migrations versionnées; médias servis depuis un bucket MinIO privé

### Core
- ✅ Identification de plantes par photo via Pl@ntNet, enrichie par GBIF
- ✅ Reconnaissance multimodale Gemini des plantes, insectes, animaux, poissons et autres êtres vivants; BioCLIP reste disponible en secours pour les insectes et animaux
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

Copiez `.env.example` vers `.env.local` pour Next.js et vers `.env` pour Docker Compose, puis remplissez chaque fichier avec des valeurs adaptées à son environnement. Ne commitez jamais ces fichiers :

```bash
cp .env.example .env.local
cp .env.example .env
```

### Variables de configuration :

| Variable | Description | Obtention |
|----------|-------------|-----------|
| `PLANTNET_API_KEY` | Identification des plantes | https://my.plantnet.org/ |
| `GEMINI_API_KEY` | Clé serveur Gemini pour la reconnaissance multimodale et l’assistant vocal | À définir dans `.env.local` et Render |
| `GEMINI_MODEL` | Modèle Gemini configurable | `gemini-2.5-flash` |
| `BIOCLIP_API_URL` | API privée du modèle BioCLIP, solution de secours | `http://127.0.0.1:8020` (Compose) |
| `DISEASE_MODEL_URL` | URL du service local de diagnostic PlantVillage | `http://127.0.0.1:8010` (Compose) |
| `OPENWEATHER_API_KEY` | Météo pour rappels intelligents | https://openweathermap.org/api |
| `GOOGLE_MAPS_API_KEY` | Cartographie avancée | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_TRANSLATE_API_KEY` | Traduction vocale | https://cloud.google.com/translate |
| `MEDIA_S3_*` | Stockage des photos dans MinIO/S3 | Voir la configuration ci-dessous |
| `JWT_SECRET` | Authentification sécurisée TERRA | `openssl rand -base64 32` |

Les plantes sont identifiées par Pl@ntNet avec `PLANTNET_API_KEY`. Le mode « Santé végétale » utilise le modèle ouvert PlantVillage EfficientNet-B4 (licence MIT) servi par le conteneur `plant-disease`; lancez `docker compose up -d plant-disease` et configurez `DISEASE_MODEL_URL`. Il distingue 38 classes pour 14 cultures. Le jeu de données provient surtout d’images contrôlées : il ne couvre pas toutes les cultures ni les conditions réelles des champs, et ses scores ne constituent pas un diagnostic agronomique.

Gemini fournit la reconnaissance visuelle polyvalente des plantes, insectes, animaux terrestres, poissons et autres formes de vie. Pour le développement local, copiez `.env.example` vers `.env.local`, définissez `GEMINI_API_KEY` avec une clé créée dans Google AI Studio, puis lancez l’application. La clé est consommée uniquement par les routes serveur; elle ne doit jamais être préfixée par `NEXT_PUBLIC_` ni commitée. BioCLIP reste disponible en secours pour les insectes et animaux avec `BIOCLIP_API_URL=http://127.0.0.1:8020`; son conteneur et les téléchargements de modèle ne sont pas nécessaires si Gemini est configuré. Les images sont transmises à Google Gemini pour analyse. Tous les résultats sont des hypothèses visuelles à confirmer, pas des diagnostics taxonomiques certains.

Le calendrier vivant est calculé par pays à partir des observations publiques de la communauté sur 24 mois. Il mesure l’activité de partage et ne constitue pas une prévision de présence des espèces. Le réseau plantes–insectes repère des co-présences publiques dans le temps et l’espace; il ne démontre pas une pollinisation. Les alertes de proximité ne s’appuient que sur les observations publiques géolocalisées des 30 derniers jours et ne signalent pas l’absence d’espèces.

`PLANTNET_API_KEY` reste disponible comme fournisseur botanique existant lorsque Gemini n’est pas configuré. BioCLIP est auto-hébergé et ne nécessite pas de clé fournisseur. Les résultats taxonomiques peuvent être enrichis par [GBIF](https://www.gbif.org/). Une suggestion de maladie doit être confirmée sur le terrain par un professionnel avant toute intervention.

### Sons de la nature

L’interface permet d’enregistrer ou d’importer un court audio. Pour obtenir les propositions d’espèces, configurez un service d’analyse auto-hébergé compatible avec `POST multipart/form-data` contenant `audio` (et éventuellement `latitude`/`longitude`). La réponse JSON doit contenir `species` ou `results`, un tableau avec des champs comme `name`, `scientificName`, `commonName` et `confidence`. Configurez `SOUND_IDENTIFICATION_API_URL` et, si nécessaire, `SOUND_IDENTIFICATION_API_KEY`. TERRA relaie l’audio aux utilisateurs connectés et ne l’enregistre pas dans sa base; vérifiez les règles de conservation du fournisseur du modèle.

Les brouillons de publication photo hors connexion sont conservés sur l’appareil (deux au maximum), puis renvoyés automatiquement au retour du réseau et de la session utilisateur. Une clé idempotente évite les doublons si la réponse du serveur s’est perdue; appliquez la nouvelle migration Prisma après mise à jour.

## Déploiement sur Render

La configuration multi-service et les étapes Render sont décrites dans [le guide de déploiement Render](docs/render-deployment.md). Le Blueprint de production `render.full.yaml` crée TERRA, MySQL, MinIO AIStor, PlantVillage et BioCLIP dans un réseau privé. Ces services requièrent des forfaits payants; vérifiez le coût total dans Render avant de les créer.

## Base MySQL et médias MinIO

Le dépôt utilise MySQL 8.4 et MinIO AIStor pour les images. Pour démarrer les services locaux, placez votre licence AIStor dans `minio.license` à la racine du dépôt (ce fichier est ignoré par Git), définissez des mots de passe MySQL et MinIO uniques dans `.env`, configurez les identifiants média côté TERRA dans `.env.local`, puis lancez :

```bash
docker compose up -d mysql minio
```

MinIO expose l’API S3 sur `http://127.0.0.1:9000` et la console sur `http://127.0.0.1:9001`. Les ports sont liés à l’interface locale seulement. Le volume Docker `terra_minio_data` conserve les objets après le redémarrage du conteneur. TERRA utilise le bucket privé `terra-media` avec un compte applicatif limité à la lecture et l’écriture des objets du bucket. Les images personnelles restent protégées par la session de leur propriétaire.

Pour créer une licence gratuite AIStor Free, suivez la [documentation MinIO sur les licences](https://docs.min.io/aistor/operations/licenses/). Configurez `MINIO_ROOT_USER` et `MINIO_ROOT_PASSWORD` pour l’administration, puis `MEDIA_S3_ENDPOINT`, `MEDIA_S3_BUCKET`, `MEDIA_S3_ACCESS_KEY` et `MEDIA_S3_SECRET_KEY` pour l’application. Le compte média doit disposer des droits `GetBucketLocation`, `ListBucket`, `GetObject` et `PutObject` sur `terra-media`. Ne mettez jamais la licence ou les secrets dans Git.

Les migrations PostgreSQL historiques sont conservées dans `prisma/migrations-postgresql`. La nouvelle migration MySQL est indépendante. Avant de remplacer `DATABASE_URL`, gardez sa valeur PostgreSQL dans `LEGACY_POSTGRES_URL`, puis configurez la cible MySQL dans `DATABASE_URL` et lancez les commandes dans cet ordre :

```bash
npm run prisma:generate
npm run db:deploy
CONFIRM_POSTGRES_TO_MYSQL=yes npm run db:transfer:mysql
npm run media:externalize
```

Le transfert ne modifie pas PostgreSQL et s’arrête si la cible MySQL contient déjà des lignes. `npm run media:externalize` envoie les images intégrées restantes vers le bucket privé, puis TERRA les sert via ses routes publiques ou par la session de leur propriétaire.

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
