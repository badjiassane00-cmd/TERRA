# Préparation et déploiement de TERRA

## Prérequis de production

- Node.js 20.9 ou plus récent (Node 22 LTS recommandé), npm et accès de sortie vers les fournisseurs utilisés.
- MySQL 8 compatible avec le schéma Prisma; base privée, sauvegardée et inaccessible directement depuis Internet.
- Stockage objet S3/MinIO avec un compte applicatif dédié limité au bucket TERRA. L’endpoint doit rester sur un réseau privé ou utiliser HTTPS.
- Domaine public, HTTPS terminé par un reverse proxy ou le fournisseur d’hébergement, et cookies sécurisés en production.
- Variables définies dans l’environnement du service : `DATABASE_URL`, `JWT_SECRET` (aléatoire, 32 caractères minimum), `APP_URL` (URL publique HTTPS), `MEDIA_S3_ENDPOINT`, `MEDIA_S3_BUCKET`, `MEDIA_S3_ACCESS_KEY` et `MEDIA_S3_SECRET_KEY`. Les clés des fournisseurs optionnels ne sont requises que pour activer leurs fonctions.
- Pour créer le super-admin au démarrage, définir `SUPER_ADMIN_EMAIL` et `SUPER_ADMIN_PASSWORD` dans l’environnement du service. Ne jamais versionner le mot de passe; il est haché avec bcrypt et l’initialisation peut être relancée sans créer de doublon.

Ne copiez pas les identifiants locaux de `.env` en production. Ne publiez pas `.env`, `.env.local`, la licence MinIO ni les clés API.

## Contrôles avant chaque version

```bash
npm ci
npm run prisma:generate
npm run check:production-env
npx prisma migrate status
npm run lint
npx tsc --noEmit
npm run build
```

Le script de configuration n’affiche jamais les valeurs des secrets. Il charge `.env`, puis les fichiers `.env.production` et `.env.production.local`; les variables d’environnement du processus ont priorité.

## Mise en service

1. Créer une sauvegarde MySQL et un snapshot du bucket média.
2. Déployer le code construit et ses variables de production.
3. Exécuter `npm run db:deploy` une fois par version avant de basculer le trafic.
4. Démarrer l’application avec `npm start` derrière HTTPS. Garder l’application et MySQL/MinIO dans des réseaux privés.
5. Sonder `GET /api/health`; le statut `200` indique que MySQL et le bucket configuré sont joignables. Un statut `503` doit bloquer la bascule du trafic.
6. Vérifier connexion, identification, création d’observation, galerie, commentaires et notifications avec un compte de contrôle. Supprimer ensuite ce compte et ses données.

## Administration

Render exécute automatiquement les migrations MySQL avant le build. Au démarrage, le compte super-admin est créé ou mis à jour si `SUPER_ADMIN_EMAIL` et `SUPER_ADMIN_PASSWORD` sont tous deux configurés. Pour une autre base, définir ces deux variables puis lancer `npm run prisma:bootstrap-admin` après les migrations. Le même bootstrap fonctionne pour les deux fournisseurs Prisma pris en charge.

## Retour arrière

Le retour arrière du code ne restaure pas automatiquement une base après migration. Garder la sauvegarde et la version précédente jusqu’à validation des parcours en production. Pour une migration avec changement de données, restaurer MySQL depuis la sauvegarde correspondante avant de relancer l’ancienne version.

## Limites connues à lever

Les accès Prisma directs depuis les routes API sont limités à la sonde `/api/health`, qui vérifie la disponibilité MySQL. Les parcours réels en production, la supervision et les sauvegardes dépendent encore du fournisseur d’hébergement choisi. Les tests de fumée locaux ne remplacent pas une validation visuelle mobile ni un essai de charge. Le fournisseur et la cible d’hébergement ne sont pas configurés dans ce dépôt : leurs paramètres réseau, TLS, sauvegardes et supervision doivent être renseignés au moment du choix d’infrastructure.
