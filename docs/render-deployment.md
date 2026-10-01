# Déployer TERRA sur Render

Le Blueprint `render.yaml` décrit quatre services dans la région de Francfort : TERRA (web), MySQL, MinIO AIStor et le modèle PlantVillage. Render fournit à TERRA une URL `onrender.com` avec HTTPS géré automatiquement. Un domaine personnalisé pourra être relié plus tard depuis le tableau de bord.

## Avant la création

1. Créer un dépôt Git privé sur GitHub et y pousser cette branche. Aucun dépôt distant Git n'est actuellement configuré dans ce projet.
2. Dans Render, relier le dépôt et créer un Blueprint depuis `render.yaml`.
3. Les trois services `1c-2g`/`0.5c-512mb` et les deux disques de 10 Go sont payants. Estimation actuelle : environ **87 USD/mois** (web 25, PlantVillage 25, MySQL 25, MinIO 7, disques 5), hors bande passante excédentaire, frais de l’espace de travail, taxes et crédits d’identification. Vérifier le tarif affiché par Render avant de créer les ressources.

## Secrets et stockage

- Render génère les mots de passe MySQL, le mot de passe racine MinIO et `JWT_SECRET`. Le Blueprint ne contient aucun secret.
- Dans le service MinIO, téléverser le fichier de licence AIStor comme secret file nommé `minio.license`. Il sera disponible sous `/etc/secrets/minio.license`.
- Créer le bucket privé `terra-media` dans MinIO, puis un utilisateur applicatif limité à ce bucket. Saisir ses clés dans `MEDIA_S3_ACCESS_KEY` et `MEDIA_S3_SECRET_KEY` du service web.
- Saisir les clés Pl@ntNet et Insect.id dans le service web. La clé Insect.id refusée en local doit être remplacée par une clé propre au produit Insect.id avec des crédits affectés.
- Ne pas importer `.env` ou `.env.local` en bloc : ils contiennent des adresses locales `127.0.0.1` et des secrets de développement.

## Déploiement et contrôle

Le service web construit Next.js, génère Prisma, applique les migrations par `preDeployCommand`, puis démarre sur `0.0.0.0:$PORT`. Le script de démarrage compose `DATABASE_URL`, `MEDIA_S3_ENDPOINT` et `DISEASE_MODEL_URL` à partir des noms DNS privés Render; il réessaie les migrations si MySQL n'a pas encore démarré.

Après le premier déploiement, vérifier `/api/health`, créer une observation avec photo, tester l'identification végétale, le diagnostic PlantVillage et une reconnaissance Insect.id, puis contrôler les journaux et le solde de crédits du fournisseur.

## Sauvegardes et limites

MySQL et MinIO utilisent des disques persistants Render. Configurer des sauvegardes MySQL `mysqldump` hors du disque de la base et tester leur restauration; les snapshots de disque ne remplacent pas les sauvegardes cohérentes MySQL. Le stockage MinIO doit aussi être sauvegardé hors service avant toute opération destructive. Les services avec disque ne peuvent pas être déployés en plusieurs instances et n'ont pas de déploiement sans interruption.
