# Déployer TERRA sur Render

Le Blueprint `render.yaml` décrit quatre services dans la région de Francfort : TERRA (web), MySQL, MinIO AIStor et le modèle PlantVillage. Render fournit à TERRA une URL `onrender.com` avec HTTPS géré automatiquement. Un domaine personnalisé pourra être relié plus tard depuis le tableau de bord.

## Avant la création

1. Créer un dépôt Git privé sur GitHub et y pousser cette branche. Aucun dépôt distant Git n'est actuellement configuré dans ce projet.
2. Dans Render, relier le dépôt et créer un Blueprint depuis la configuration de production complète.
3. Tous les services et disques de cette configuration sont payants. Elle inclut désormais un service BioCLIP `1c-2g` avec un disque de 10 Go. Vérifier l’estimation affichée par Render avant toute création; le total dépend des tarifs et de la région du compte.

## Secrets et stockage

- Render génère les mots de passe MySQL, le mot de passe racine MinIO et `JWT_SECRET`. Le Blueprint ne contient aucun secret.
- Dans le service MinIO, téléverser le fichier de licence AIStor comme secret file nommé `minio.license`. Il sera disponible sous `/etc/secrets/minio.license`.
- Créer le bucket privé `terra-media` dans MinIO, puis un utilisateur applicatif limité à ce bucket. Saisir ses clés dans `MEDIA_S3_ACCESS_KEY` et `MEDIA_S3_SECRET_KEY` du service web.
- Ajouter `GEMINI_API_KEY` dans **Environment** sur le service web Render (clé secrète depuis Google AI Studio), `GEMINI_MODEL=gemini-3.8-flash` et `GEMINI_FALLBACK_MODEL=gemini-3.7-flash`. En cas de surcharge temporaire sur le modèle principal, TERRA tente le modèle de secours. La clé ne doit pas être placée dans Git ni dans une variable `NEXT_PUBLIC_*`. Les appels aux API passent par le serveur.
- `PLANTNET_API_KEY` reste un fournisseur botanique de secours. BioCLIP auto-hébergé demeure le secours insectes/animaux lorsque Gemini n’est pas configuré.
- Ne pas importer `.env` ou `.env.local` en bloc : ils contiennent des adresses locales `127.0.0.1` et des secrets de développement.

## Déploiement et contrôle

Le service web construit Next.js, génère Prisma, applique les migrations par `preDeployCommand`, puis démarre sur `0.0.0.0:$PORT`. Le script de démarrage compose `DATABASE_URL`, `MEDIA_S3_ENDPOINT` et `DISEASE_MODEL_URL` à partir des noms DNS privés Render; il réessaie les migrations si MySQL n'a pas encore démarré.

BioCLIP est volontairement séparé du Blueprint web gratuit : le modèle et ses données taxonomiques nécessitent plusieurs gigaoctets de mémoire et un cache persistant. La configuration complète `render.full.yaml` crée le service Docker et relie son adresse privée à TERRA. Le fichier `render.bioclip.yaml` permet aussi de déployer le modèle séparément. Le service et son disque sont payants; vérifiez le tarif affiché dans Render avant leur création. Sans ce service, l’API renvoie un message de configuration au lieu d’échouer sur une clé Insect.id.

Après le premier déploiement, vérifier `/api/health`, créer une observation avec photo, tester l'identification végétale et, une fois BioCLIP connecté, tester l’identification d’un insecte ou d’un animal.

## Sauvegardes et limites

MySQL et MinIO utilisent des disques persistants Render. Configurer des sauvegardes MySQL `mysqldump` hors du disque de la base et tester leur restauration; les snapshots de disque ne remplacent pas les sauvegardes cohérentes MySQL. Le stockage MinIO doit aussi être sauvegardé hors service avant toute opération destructive. Les services avec disque ne peuvent pas être déployés en plusieurs instances et n'ont pas de déploiement sans interruption.
