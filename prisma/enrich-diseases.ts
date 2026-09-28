import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const diseaseDatabase: Record<string, Array<{ disease: string; confidence: number; description: string; treatment: string[] }>> = {
  "Adansonia digitata": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.7,
      description: "Fongus qui attaque les racines du baobab, souvent causé par un excès d'eau.",
      treatment: ["Réduire l'arrosage", "Améliorer le drainage", "Traitement fongicide systémique"],
    },
    {
      disease: "Pucerons",
      confidence: 0.6,
      description: "Petits insectes suceurs pouvant affaiblir les jeunes pousses.",
      treatment: ["Savon noir", "Purins d'ortie", "Introduction de coccinelles"],
    },
  ],
  "Spathodea campanulata": [
    {
      disease: "Oïdium",
      confidence: 0.8,
      description: "Dépôt blanc poudreux sur les feuilles, favorisé par l'humidité.",
      treatment: ["Bicarbonate de potassium", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
    {
      disease: "Rouille",
      confidence: 0.65,
      description: "Taches orangées sur les feuilles dues à un champignon.",
      treatment: ["Bouillie bordelaise", "Retirer les feuilles infectées", "Traitement préventif"],
    },
  ],
  "Acacia senegal": [
    {
      disease: "Brûlure des feuilles",
      confidence: 0.75,
      description: "Taches nécrotiques sur les feuilles, souvent bactérienne.",
      treatment: ["Éviter l'humidité sur les feuilles", "Traitement cuivré", "Variétés résistantes"],
    },
    {
      disease: "Pucerons",
      confidence: 0.8,
      description: "Peut transmettre des virus et affaiblir l'arbre.",
      treatment: ["Savon noir", "Purins d'ortie", "Introduction de coccinelles"],
    },
  ],
  "Olea europaea subsp. cuspidata": [
    {
      disease: "Mildiou",
      confidence: 0.7,
      description: "Maladie cryptogamique favorisée par l'humidité.",
      treatment: ["Bouillie bordelaise", "Éviter l'arrosage sur les feuilles", "Variétés résistantes"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.6,
      description: "Taches brunes ou noires sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
  ],
  "Moringa oleifera": [
    {
      disease: "Pourriture des racines",
      confidence: 0.75,
      description: "Pourriture causée par un excès d'eau ou un sol mal drainé.",
      treatment: ["Réduire l'arrosage", "Améliorer le drainage", "Rempotage si nécessaire"],
    },
    {
      disease: "Pucerons",
      confidence: 0.8,
      description: "Attaquent les nouvelles pousses et fleurs.",
      treatment: ["Savon noir", "Purins d'ortie", "Introduction de coccinelles"],
    },
  ],
  "Azadirachta indica": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.7,
      description: "Fongus attaquant les racines en sol trop humide.",
      treatment: ["Réduire l'arrosage", "Améliorer le drainage", "Fongicide systémique"],
    },
    {
      disease: "Rouille",
      confidence: 0.65,
      description: "Taches orangées sur les feuilles.",
      treatment: ["Bouillie bordelaise", "Retirer les feuilles infectées", "Traitement préventif"],
    },
  ],
  "Hibiscus rosa-sinensis": [
    {
      disease: "Oïdium",
      confidence: 0.8,
      description: "Dépôt blanc poudreux sur les feuilles et boutons.",
      treatment: ["Bicarbonate de potassium", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
    {
      disease: "Pucerons",
      confidence: 0.85,
      description: "Affaiblissent la plante et transmettent des virus.",
      treatment: ["Savon noir", "Purins d'ortie", "Introduction de coccinelles"],
    },
  ],
  "Bougainvillea glabra": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.7,
      description: "Causée par un excès d'eau.",
      treatment: ["Réduire l'arrosage", "Améliorer le drainage", "Fongicide"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.6,
      description: "Taches brunes sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Éviter l'humidité", "Traitement fongicide"],
    },
  ],
  "Delonix regia": [
    {
      disease: "Rouille",
      confidence: 0.75,
      description: "Taches orangées sur les feuilles.",
      treatment: ["Bouillie bordelaise", "Retirer les feuilles infectées", "Traitement préventif"],
    },
    {
      disease: "Pucerons",
      confidence: 0.7,
      description: "Attaquent les nouvelles pousses.",
      treatment: ["Savon noir", "Purins d'ortie", "Introduction de coccinelles"],
    },
  ],
  "Jacaranda mimosifolia": [
    {
      disease: "Oïdium",
      confidence: 0.7,
      description: "Dépôt blanc poudreux sur les feuilles.",
      treatment: ["Bicarbonate de potassium", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.65,
      description: "Taches brunes ou noires sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Éviter l'humidité"],
    },
  ],
  "Entandrophragma cylindricum": [
    {
      disease: "Pourriture du bois",
      confidence: 0.6,
      description: "Fongus attaquant le bois en forêt humide.",
      treatment: ["Récolte à maturité", "Traitement préservatif", "Stockage sec"],
    },
    {
      disease: "Attaque d'insectes",
      confidence: 0.5,
      description: "Coléoptères et termites pouvant endommager le bois.",
      treatment: ["Traitement insecticide", "Stockage protégé", "Utilisation de bois traité"],
    },
  ],
  "Milicia excelsa": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.6,
      description: "Fongus en sol trop humide.",
      treatment: ["Améliorer le drainage", "Réduire l'humidité", "Fongicide"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.55,
      description: "Taches brunes sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
  ],
  "Carica papaya": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.8,
      description: "Fongus attaquant les racines, souvent fatal.",
      treatment: ["Réduire l'arrosage", "Améliorer le drainage", "Fongicide systémique"],
    },
    {
      disease: "Mosaïque du papayer",
      confidence: 0.75,
      description: "Virus transmis par les pucerons.",
      treatment: ["Éliminer les plantes infectées", "Lutter contre les pucerons", "Variétés résistantes"],
    },
  ],
  "Vitellaria paradoxa": [
    {
      disease: "Pourriture des fruits",
      confidence: 0.7,
      description: "Fongus attaquant les fruits en maturation.",
      treatment: ["Récolte précoce", "Traitement fongicide", "Stockage approprié"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.65,
      description: "Taches brunes sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
  ],
  "Podocarpus latifolius": [
    {
      disease: "Rouille",
      confidence: 0.6,
      description: "Taches orangées sur les aiguilles.",
      treatment: ["Bouillie bordelaise", "Améliorer la circulation d'air", "Traitement préventif"],
    },
    {
      disease: "Pourriture racinaire",
      confidence: 0.55,
      description: "Fongus en sol trop humide.",
      treatment: ["Améliorer le drainage", "Réduire l'arrosage", "Fongicide"],
    },
  ],
  "Pachypodium lamerei": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.8,
      description: "Fongus mortel causé par un excès d'eau.",
      treatment: ["Arrêter l'arrosage", "Rempotage dans sol sec", "Fongicide systémique"],
    },
    {
      disease: "Cochenilles",
      confidence: 0.7,
      description: "Insectes suceurs sur les tiges et feuilles.",
      treatment: ["Alcool à 70°", "Savon noir", "Huile de paraffine"],
    },
  ],
  "Nymphaea caerulea": [
    {
      disease: "Pourriture des feuilles",
      confidence: 0.7,
      description: "Fongus sur les feuilles flottantes.",
      treatment: ["Retirer les feuilles infectées", "Améliorer la circulation d'eau", "Traitement fongicide aquatique"],
    },
    {
      disease: "Limaces et escargots",
      confidence: 0.75,
      description: "Rongent les feuilles et fleurs.",
      treatment: ["Pièges à bière", "Bacillus thuringiensis", "Nettoyage régulier"],
    },
  ],
  "Zingiber officinale": [
    {
      disease: "Pourriture des rhizomes",
      confidence: 0.8,
      description: "Fongus attaquant les rhizomes en sol trop humide.",
      treatment: ["Améliorer le drainage", "Traitement fongicide", "Rotation des cultures"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.7,
      description: "Taches brunes sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Éviter l'humidité"],
    },
  ],
  "Cinnamomum verum": [
    {
      disease: "Pourriture racinaire",
      confidence: 0.65,
      description: "Fongus en sol trop humide.",
      treatment: ["Améliorer le drainage", "Réduire l'arrosage", "Fongicide"],
    },
    {
      disease: "Taches foliaires",
      confidence: 0.6,
      description: "Taches brunes sur les feuilles.",
      treatment: ["Retirer les feuilles infectées", "Traitement fongicide", "Améliorer la circulation d'air"],
    },
  ],
};

export async function main() {
  console.log("Enriching species with comprehensive disease data...");

  const plants = await prisma.plant.findMany();

  for (const plant of plants) {
    const diseases = diseaseDatabase[plant.scientificName];
    if (!diseases) continue;

    const dbDiseases = await prisma.disease.findMany({
      where: {
        name: {
          in: diseases.map((d) => d.disease),
        },
      },
    });

    for (const disease of diseases) {
      let dbDisease = dbDiseases.find((d) => d.name === disease.disease);

      if (!dbDisease) {
        dbDisease = await prisma.disease.create({
          data: {
            name: disease.disease,
            description: disease.description,
            treatment: JSON.stringify(disease.treatment),
            confidence: disease.confidence,
          },
        });
      }

      await prisma.plantDisease.upsert({
        where: {
          plantId_diseaseId: {
            plantId: plant.id,
            diseaseId: dbDisease.id,
          },
        },
        update: {
          confidence: disease.confidence,
        },
        create: {
          plantId: plant.id,
          diseaseId: dbDisease.id,
          confidence: disease.confidence,
        },
      });
    }
  }

  console.log("Disease enrichment complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
