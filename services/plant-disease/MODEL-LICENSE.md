The inference architecture and trained weights are derived from **Plant Disease Detector** by Abeer Ashraf, licensed under MIT:
https://github.com/khawaja1447/plant-disease-detector

The upstream model was trained on PlantVillage and reports 38 labels across 14 crop species. Its reported score is measured on a held-out PlantVillage split, not on TERRA user photos. Its maintainers explicitly note that field images differ from PlantVillage's controlled leaf photos and that the model always selects among its known classes. See the upstream model card for details and citations.
