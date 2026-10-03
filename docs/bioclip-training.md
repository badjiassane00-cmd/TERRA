# Entraîner la tête TERRA avec GBIF

TERRA utilise déjà BioCLIP comme modèle généraliste. Le pipeline ci-dessous entraîne une tête Ridge légère sur les embeddings BioCLIP, à partir de photos d’occurrences GBIF. Il ne réentraîne pas le modèle fondation et ne couvre que les espèces qui ont suffisamment d’images sous licence ouverte et qui existent aussi dans la taxonomie BioCLIP.

La collecte accepte uniquement les licences explicites CC0, CC BY 4.0 et CC BY-SA 4.0. Les noms de créateurs, titulaires de droits, identifiants d’occurrence, éditeurs, URL et licences sont conservés dans `manifest.csv`. Les images CC BY-NC, CC BY-ND, sans licence ou servies en HTTP sont exclues.

## Entraînement dans Colab

1. Dans Colab, sélectionner **Exécution > Modifier le type d’exécution > GPU**, puis monter Drive.
2. Installer les dépendances, téléverser `services/bioclip/train_gbif_head.py`, puis le copier sur Drive pour qu’il survive à une réinitialisation Colab :

```python
!pip install pybioclip==2.1.6 scikit-learn==1.7.2 Pillow==11.3.0
from google.colab import drive, files
drive.mount("/content/drive")
files.upload()  # choisir train_gbif_head.py dans le dépôt TERRA
!cp /content/train_gbif_head.py /content/drive/MyDrive/train_gbif_head.py
```

3. Collecter un jeu global d’images sous licences ouvertes. Le réglage cible jusqu’à 250 espèces par groupe (environ 1 500 classes au plus), avec au moins 20 photos et un plafond de 30 photos par espèce :

```bash
!python /content/drive/MyDrive/train_gbif_head.py collect \
  --workdir /content/drive/MyDrive/terra-gbif-full \
  --pages-per-kingdom 200 \
  --min-images 20 \
  --max-images 30 \
  --max-species-per-group 250 \
  --download-timeout 8 \
  --max-failures-per-species 2
```

La collecte peut durer longtemps. Elle enregistre un checkpoint après chaque page GBIF et peut être reprise après une déconnexion Colab en remontant Drive et en relançant la même commande avec le même `--workdir` et le même `--page-size` (300 par défaut). Ne lance pas deux collectes en parallèle sur le même dossier. Le manifeste n'est créé qu'après le parcours GBIF et la collecte des images.

4. Examiner `/content/terra-gbif/manifest.csv`, notamment les colonnes `license`, `creator`, `rights_holder`, `occurrence_id` et `image_url`. Augmenter `--pages-per-kingdom` si certains groupes n’ont pas assez de classes.
5. Extraire les embeddings, entraîner et mesurer le modèle sur un jeu de validation séparé :

```bash
!python /content/drive/MyDrive/train_gbif_head.py train \
  --workdir /content/drive/MyDrive/terra-gbif-full \
  --manifest /content/drive/MyDrive/terra-gbif-full/manifest.csv \
  --output /content/drive/MyDrive/terra-bioclip-head.pt \
  --min-images 20 \
  --minimum-precision 0.80
```

L’entraînement échoue volontairement si moins de deux espèces sont disponibles ou si aucune classe ne peut atteindre la précision minimale mesurée sur validation. Le rapport affiche le nombre d’espèces, la précision top-1 et top-5 et le seuil de confiance. Ce score est une mesure interne au jeu GBIF collecté, pas une garantie de performance sur des photos de terrain.

6. Télécharger `terra-bioclip-head.pt` et `terra-bioclip-head-attributions.csv` depuis Drive et les conserver ensemble. Le CSV compagnon liste les images, licences et crédits qui ont réellement servi à l’entraînement. Placer le `.pt` validé dans `services/bioclip/models/terra-bioclip-head.pt`.
7. Committer l’artefact validé et pousser la branche. Le build du service BioCLIP copie `services/bioclip/models` dans l’image ; au démarrage, il charge la tête seulement si elle correspond à la version BioCLIP configurée. Le service continue d’utiliser BioCLIP seul en cas d’absence ou d’incompatibilité de l’artefact.

## Comportement en production

La tête TERRA ne remplace pas BioCLIP : elle propose des résultats pour ses classes entraînées et le filtre sélectionné. Si le meilleur score est sous le seuil calibré sur validation, ou si aucune classe n’est couverte pour ce groupe, le service retombe sur les prédictions générales BioCLIP. Les réponses indiquent `BioCLIP + TERRA` lorsque la tête a été utilisée.

Le premier collecteur couvre les occurrences photographiques GBIF des règnes Animalia, Plantae, Fungi, Chromista et Protozoa trouvées dans l’échantillon consulté. Les microorganismes et les espèces sans photos ouvertes suffisantes ne sont pas couverts ; « mondial » décrit la source des données, pas une couverture exhaustive du vivant. Les licences et attributions doivent rester avec l’artefact pour toute redistribution des images.
