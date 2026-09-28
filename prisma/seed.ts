import { PrismaClient, LocationType } from "@prisma/client";

const prisma = new PrismaClient();

type LocationSeed = {
  name: string;
  lat: number;
  lng: number;
  region: string;
  speciesCount: number;
  type: LocationType;
  description: string;
  bloomingMonths?: string;
};

async function main() {
  const plants = [
    {
      scientificName: "Adansonia digitata",
      commonNames: '["Baobab", "Pain de singe", "Boabab"]',
      family: "Malvaceae",
      genus: "Adansonia",
      species: "digitata",
      description: "Arbre emblématique de l'Afrique, pouvant vivre plus de 1000 ans. Son tronc massive peut stocker jusqu'à 120 000 litres d'eau.",
      taxonomy: '{"kingdom":"Plantae","order":"Malvales","family":"Malvaceae","genus":"Adansonia","species":"A. digitata"}',
      medicinal: true,
      edibleParts: '["feuilles", "fruits", "graines"]',
      toxicity: "[]",
      watering: "Arrosage rare et espacé",
      sunlight: "Ensoleillement direct",
      soil: "Sol bien drainé, pauvre",
      growthRate: "Lent",
      imageUrl: "https://images.unsplash.com/photo-1599592574727-290c38af6f8f",
      gbifId: "3156366",
    },
    {
      scientificName: "Spathodea campanulata",
      commonNames: '["Flamme de la forêt", "Tulipe africaine", "African tulip tree"]',
      family: "Bignoniaceae",
      genus: "Spathodea",
      species: "campanulata",
      description: "Arbre tropical aux fleurs rouge-orangé spectaculaires en forme de tulipe. Originaire d'Afrique équatoriale.",
      taxonomy: '{"kingdom":"Plantae","order":"Lamiales","family":"Bignoniaceae","genus":"Spathodea","species":"S. campanulata"}',
      medicinal: true,
      edibleParts: "[]",
      toxicity: '["Sève irritante pour la peau et les yeux"]',
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct à partiel",
      soil: "Sol riche et bien drainé",
      growthRate: "Rapide",
      imageUrl: "https://images.unsplash.com/photo-1598880940080-ff9a29891b9a",
      gbifId: "3156367",
    },
    {
      scientificName: "Acacia senegal",
      commonNames: '["Acacia", "Gommier blanc", "Gum arabic tree"]',
      family: "Fabaceae",
      genus: "Acacia",
      species: "senegal",
      description: "Arbre épineux produisant la gomme arabique. Essentiel pour l'industrie alimentaire et pharmaceutique.",
      taxonomy: '{"kingdom":"Plantae","order":"Fabales","family":"Fabaceae","genus":"Acacia","species":"A. senegal"}',
      medicinal: true,
      edibleParts: '["gomme", "feuilles"]',
      toxicity: "[]",
      watering: "Très résistant à la sécheresse",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et sablonneux",
      growthRate: "Moyen",
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
      gbifId: "3156368",
    },
    {
      scientificName: "Olea europaea subsp. cuspidata",
      commonNames: '["Olive africaine", "Olive sauvage"]',
      family: "Oleaceae",
      genus: "Olea",
      species: "europaea",
      description: "Arbre méditerranéen adapté aux climats secs. Ses fruits donnent une huile de qualité et ses feuilles sont utilisées en phytothérapie.",
      taxonomy: '{"kingdom":"Plantae","order":"Lamiales","family":"Oleaceae","genus":"Olea","species":"O. europaea"}',
      medicinal: true,
      edibleParts: '["fruits", "feuilles"]',
      toxicity: "[]",
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol calcaire et drainé",
      growthRate: "Lent",
      imageUrl: "https://images.unsplash.com/photo-1578490057216-f69104fbf402",
      gbifId: "3156369",
    },
    {
      scientificName: "Moringa oleifera",
      commonNames: '["Moringa", "Arbre de vie", "Moringue"]',
      family: "Moringaceae",
      genus: "Moringa",
      species: "oleifera",
      description: "Arbre aux multiples vertus nutritionnelles et médicinales. Toutes ses parties sont utilisables.",
      taxonomy: '{"kingdom":"Plantae","order":"Brassicales","family":"Moringaceae","genus":"Moringa","species":"M. oleifera"}',
      medicinal: true,
      edibleParts: '["feuilles", "fruits", "graines", "racines"]',
      toxicity: "[]",
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement direct",
      soil: "Sol drainé, pauvre à fertile",
      growthRate: "Rapide",
      imageUrl: "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c8",
      gbifId: "3156370",
    },
    {
      scientificName: "Azadirachta indica",
      commonNames: '["Neem", "Margousier", "Nim"]',
      family: "Meliaceae",
      genus: "Azadirachta",
      species: "indica",
      description: "Arbre sacré aux propriétés insecticides et médicinales exceptionnelles. Utilisé en agriculture biologique.",
      taxonomy: '{"kingdom":"Plantae","order":"Sapindales","family":"Meliaceae","genus":"Azadirachta","species":"A. indica"}',
      medicinal: true,
      edibleParts: '["feuilles"]',
      toxicity: '["Huile concentrée toxique par ingestion"]',
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et drainé",
      growthRate: "Moyen",
      imageUrl: "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c8",
      gbifId: "3156371",
    },
  ];

  const diseases = [
    {
      name: "Oïdium",
      description: "Maladie fongique provoquant un dépôt blanc poudreux sur les feuilles.",
      treatment: '["Traitement fongicide", "Bicarbonate de potassium", "Améliorer la circulation d\'air"]',
      confidence: 0.85,
    },
    {
      name: "Pucerons",
      description: "Petits insectes suceurs qui affaiblissent les plantes et transmettent des virus.",
      treatment: '["Savon noir", "Purins d\'ortie", "Introduction de coccinelles"]',
      confidence: 0.78,
    },
    {
      name: "Mildiou",
      description: "Maladie cryptogamique causée par des champignons, favorisée par l'humidité.",
      treatment: '["Bouillie bordelaise", "Éviter l\'arrosage sur les feuilles", "Variétés résistantes"]',
      confidence: 0.72,
    },
    {
      name: "Pourriture racinaire",
      description: "Fongus qui attaque les racines, souvent causé par un excès d'eau.",
      treatment: '["Réduire l\'arrosage", "Fongicide systémique", "Rempotage avec nouveau substrat"]',
      confidence: 0.68,
    },
    {
      name: "Taches foliaires",
      description: "Taches brunes ou noires sur les feuilles, souvent d'origine bactérienne ou fongique.",
      treatment: '["Retirer les feuilles infectées", "Éviter l\'humidité sur les feuilles", "Traitement cuivré"]',
      confidence: 0.74,
    },
  ];

  const locations: LocationSeed[] = [
    {
      name: "Jardin botanique de Dakar",
      lat: 14.7167,
      lng: -17.4677,
      region: "Afrique de l'Ouest",
      speciesCount: 342,
      type: "JARDIN_BOTANIQUE",
      description: "Collection de plantes tropicales et méditerranéennes",
      bloomingMonths: '["juin", "juillet", "août"]',
    },
    {
      name: "Parc national du Mont Nimba",
      lat: 7.6167,
      lng: -8.4167,
      region: "Afrique de l'Ouest",
      speciesCount: 1205,
      type: "PARC_NATIONAL",
      description: "Biodiversité exceptionnelle avec flore endémique",
      bloomingMonths: '["mai", "juin", "juillet"]',
    },
    {
      name: "Réserve de Faune du Dja",
      lat: 3.5,
      lng: 12.75,
      region: "Afrique Centrale",
      speciesCount: 890,
      type: "RESERVE",
      description: "Forêt dense avec espèces végétales rares",
      bloomingMonths: '["mars", "avril", "mai"]',
    },
    {
      name: "Parc national de Kakamega",
      lat: 0.3,
      lng: 34.8667,
      region: "Afrique de l'Est",
      speciesCount: 567,
      type: "PARC_NATIONAL",
      description: "Forêt tropicale relique avec flore unique",
      bloomingMonths: '["septembre", "octobre", "novembre"]',
    },
    {
      name: "Jardin d'Essais du Hamma",
      lat: 36.75,
      lng: 3.05,
      region: "Afrique du Nord",
      speciesCount: 234,
      type: "JARDIN_BOTANIQUE",
      description: "Collection de plantes méditerranéennes et subtropicales",
      bloomingMonths: '["mai", "juin", "juillet"]',
    },
    {
      name: "Parc national du Serengeti",
      lat: -2.3333,
      lng: 34.8333,
      region: "Afrique de l'Est",
      speciesCount: 678,
      type: "PARC_NATIONAL",
      description: "Savane avec flore adaptée aux grands mammifères",
      bloomingMonths: '["janvier", "février", "mars"]',
    },
    {
      name: "Forêt de la Lopé",
      lat: -0.2167,
      lng: 11.5833,
      region: "Afrique Centrale",
      speciesCount: 1456,
      type: "RESERVE",
      description: "Écosystème forestier avec diversité botanique remarquable",
      bloomingMonths: '["avril", "mai", "juin"]',
    },
    {
      name: "Jardin botanique de l'Université de Dakar",
      lat: 14.7167,
      lng: -17.4677,
      region: "Afrique de l'Ouest",
      speciesCount: 445,
      type: "JARDIN_UNIVERSITAIRE",
      description: "Herbier vivant pour la recherche et l'éducation",
      bloomingMonths: '["juin", "juillet", "août", "septembre"]',
    },
  ];

  for (const plant of plants) {
    await prisma.plant.upsert({
      where: { scientificName: plant.scientificName },
      update: plant,
      create: plant,
    });
  }

  for (const disease of diseases) {
    await prisma.disease.upsert({
      where: { name: disease.name },
      update: disease,
      create: disease,
    });
  }

  for (const location of locations) {
    await prisma.location.upsert({
      where: { id: location.name.toLowerCase().replace(/\s+/g, "-") },
      update: location,
      create: {
        ...location,
        id: location.name.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }

  const dbPlants = await prisma.plant.findMany();
  const dbDiseases = await prisma.disease.findMany();
  const dbLocations = await prisma.location.findMany();

  for (const plant of dbPlants) {
    for (const disease of dbDiseases.slice(0, 3)) {
      await prisma.plantDisease.upsert({
        where: { plantId_diseaseId: { plantId: plant.id, diseaseId: disease.id } },
        update: {},
        create: { plantId: plant.id, diseaseId: disease.id, confidence: disease.confidence },
      });
    }
  }

  for (const location of dbLocations) {
    for (const plant of dbPlants.slice(0, 3)) {
      await prisma.locationPlant.upsert({
        where: { locationId_plantId: { locationId: location.id, plantId: plant.id } },
        update: {},
        create: { locationId: location.id, plantId: plant.id },
      });
    }
  }

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@botanique.app" },
    update: {},
    create: {
      email: "demo@botanique.app",
      password: "$2a$10$demoHashForTestingOnly",
      name: "Utilisateur Démo",
      institution: "Université de Dakar",
      role: "INSTITUTION",
    },
  });

  await prisma.gamificationProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      points: 1250,
      level: 3,
      badges: '["first_scan","botanist"]',
      streak: 7,
    },
  });

  const demoReminders = [
    {
      userId: demoUser.id,
      type: "WATERING" as const,
      plantName: "Baobab",
      frequency: "weekly",
      time: "08:00",
      enabled: true,
      nextReminder: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      userId: demoUser.id,
      type: "FERTILIZING" as const,
      plantName: "Acacia",
      frequency: "monthly",
      time: "09:00",
      enabled: false,
      nextReminder: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
  ];

  for (const reminder of demoReminders) {
    await prisma.reminder.create({
      data: reminder,
    });
  }

  const demoTrainingData = [
    {
      userId: demoUser.id,
      plantName: "Baobab",
      label: "Baobab",
      scientificName: "Adansonia digitata",
      imageUrl: "https://images.unsplash.com/photo-1599592574727-290c38af6f8f",
      confidence: 0.92,
      isVerified: true,
      usedForTraining: true,
    },
    {
      userId: demoUser.id,
      plantName: "Acacia",
      label: "Acacia",
      scientificName: "Acacia senegal",
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
      confidence: 0.88,
      isVerified: true,
      usedForTraining: true,
    },
    {
      userId: demoUser.id,
      plantName: "Flamme de la forêt",
      label: "Flamme de la forêt",
      scientificName: "Spathodea campanulata",
      imageUrl: "https://images.unsplash.com/photo-1598880940080-ff9a29891b9a",
      confidence: 0.85,
      isVerified: true,
      usedForTraining: true,
    },
  ];

  for (const training of demoTrainingData) {
    await prisma.trainingData.create({
      data: training,
    });
  }

  await prisma.modelVersion.upsert({
    where: { version: "v1.0.0" },
    update: {},
    create: {
      version: "v1.0.0",
      name: "Initial Plant Recognition Model",
      description: "Modèle initial entraîné sur 3 espèces avec MobileNet",
      accuracy: 0.88,
      loss: 0.15,
      trainingDataCount: 3,
      status: "DEPLOYED",
    },
  });

  console.log("Database seeded successfully with full dataset!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
