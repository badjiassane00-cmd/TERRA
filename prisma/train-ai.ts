import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const botanicalSpecies = [
  // Médicinales - Afrique de l'Ouest
  {
    scientificName: "Adansonia digitata",
    commonNames: ["Baobab", "Pain de singe", "Boabab"],
    family: "Malvaceae",
    genus: "Adansonia",
    species: "digitata",
    region: "Afrique de l'Ouest",
    countries: ["Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire", "Ghana", "Niger", "Tchad"],
    specialty: "Médicinale",
    description: "Arbre emblématique de l'Afrique, pouvant vivre plus de 1000 ans. Son tronc massif stocke jusqu'à 120 000 litres d'eau. Fruits riches en vitamine C, feuilles médicinales.",
    characteristics: {
      height: "15-25m",
      trunk: "Massif, jusqu'à 10m de diamètre",
      leaves: "Composées palmées, 5-7 folioles",
      flowers: "Blanches, odorantes, nocturnes",
      fruits: "Baies ligneuses, pulpe blanche acidulée",
      bark: "Lisse, grisâtre",
    },
    medicinal: {
      parts: ["feuilles", "fruits", "graines", "écorce"],
      properties: ["antioxydant", "anti-inflammatoire", "immunostimulant", "antidiarrhéique"],
      traditionalUses: ["fièvre", "paludisme", "infections respiratoires", "vitamine C"],
      preparation: ["décoction", "poudre", "jus", "infusion"],
    },
    care: {
      watering: "Arrosage rare et espacé",
      sunlight: "Ensoleillement direct",
      soil: "Sol bien drainé, pauvre, sablonneux",
      temperature: "20-40°C",
      humidity: "Basse",
    },
    blooming: ["juin", "juillet", "août"],
    conservation: "LC (Préoccupation mineure)",
    imageKeywords: ["baobab", "arbre africain", "tronc massif", "feuilles palmées"],
  },
  {
    scientificName: "Spathodea campanulata",
    commonNames: ["Flamme de la forêt", "Tulipe africaine", "African tulip tree"],
    family: "Bignoniaceae",
    genus: "Spathodea",
    species: "campanulata",
    region: "Afrique Centrale",
    countries: ["Cameroun", "Gabon", "Congo", "RDC", "Guinée équatoriale"],
    specialty: "Ornementale",
    description: "Arbre tropical aux fleurs rouge-orangé spectaculaires en forme de tulipe. Originaire d'Afrique équatoriale. Floraison impressionnante.",
    characteristics: {
      height: "7-15m",
      trunk: "Épaissi à la base, écorce lisse gris-brun",
      leaves: "Composées pennées, 7-19 folioles",
      flowers: "Rouge-orangé, en forme de tulipe, 8-10cm",
      fruits: "Capsule ligneuse, 15-20cm",
      bark: "Grise, crevassée avec l'âge",
    },
    ornamental: {
      use: "Arbre d'ornement",
      features: ["Floraison spectaculaire", "Feuillage dense", "Port élancé"],
      parks: ["Parcs urbains", "Jardins botaniques", "Allées"],
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct à partiel",
      soil: "Sol riche et bien drainé",
      temperature: "20-35°C",
      humidity: "Moyenne à élevée",
    },
    blooming: ["mars", "avril", "mai"],
    conservation: "LC",
    imageKeywords: ["flamme forêt", "fleurs rouges", "tulipe africaine", "arbre tropical"],
  },
  {
    scientificName: "Acacia senegal",
    commonNames: ["Acacia", "Gommier blanc", "Gum arabic tree"],
    family: "Fabaceae",
    genus: "Acacia",
    species: "senegal",
    region: "Afrique de l'Est",
    countries: ["Soudan", "Soudan du Sud", "Éthiopie", "Kenya", "Tanzanie", "Ouganda", "Sénégal"],
    specialty: "Médicinale",
    description: "Arbre épineux produisant la gomme arabique. Essentiel pour l'industrie alimentaire et pharmaceutique. Feuilles médicinales.",
    characteristics: {
      height: "5-12m",
      trunk: "Écorce grisâtre, épines courtes",
      leaves: "Feuilles bipennées, 4-8 paires de pinnules",
      flowers: "Blanc-jaunâtre, en épis",
      fruits: "Gousses plates, 7-12cm",
      bark: "Grise, rugueuse",
    },
    medicinal: {
      parts: ["gomme", "feuilles", "écorce"],
      properties: ["expectorant", "anti-inflammatoire", "émulsifiant"],
      traditionalUses: ["toux", "maux de gorge", "digestion", "gomme arabique"],
      preparation: ["décoction", "gomme naturelle", "infusion"],
    },
    care: {
      watering: "Très résistant à la sécheresse",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et sablonneux",
      temperature: "25-45°C",
      humidity: "Basse",
    },
    blooming: ["septembre", "octobre", "novembre"],
    conservation: "LC",
    imageKeywords: ["acacia", "gomme arabique", "arbre épineux", "savane"],
  },
  {
    scientificName: "Olea europaea subsp. cuspidata",
    commonNames: ["Olive africaine", "Olive sauvage"],
    family: "Oleaceae",
    genus: "Olea",
    species: "europaea",
    region: "Afrique du Nord",
    countries: ["Maroc", "Algérie", "Tunisie", "Égypte", "Libye"],
    specialty: "Médicinale",
    description: "Arbre méditerranéen adapté aux climats secs. Fruits donnant une huile de qualité. Feuilles utilisées en phytothérapie.",
    characteristics: {
      height: "8-15m",
      trunk: "Tronc tortueux, écorce grise fissurée",
      leaves: "Opposées, lancéolées, vert sombre",
      flowers: "Blanches, petites, odorantes",
      fruits: "Drupes ovales, vertes puis noires",
      bark: "Grise, profondément fissurée",
    },
    medicinal: {
      parts: ["feuilles", "fruits", "huile"],
      properties: ["antioxydant", "anti-inflammatoire", "hypotenseur"],
      traditionalUses: ["hypertension", "cholestérol", "antioxydant", "huile d'olive"],
      preparation: ["infusion", "huile", "extrait"],
    },
    care: {
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol calcaire et drainé",
      temperature: "10-40°C",
      humidity: "Basse",
    },
    blooming: ["mai", "juin", "juillet"],
    conservation: "LC",
    imageKeywords: ["olivier", "olive", "méditerranée", "feuilles argentées"],
  },
  {
    scientificName: "Moringa oleifera",
    commonNames: ["Moringa", "Arbre de vie", "Moringue"],
    family: "Moringaceae",
    genus: "Moringa",
    species: "oleifera",
    region: "Afrique de l'Ouest",
    countries: ["Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire", "Ghana", "Niger", "Inde", "Pakistan"],
    specialty: "Médicinale",
    description: "Arbre aux multiples vertus nutritionnelles et médicinales. Toutes ses parties sont utilisables. Extrêmement riche en nutriments.",
    characteristics: {
      height: "10-12m",
      trunk: "Écorce blanchâtre, fissurée",
      leaves: "Tripennées, folioles ovales",
      flowers: "Blanches, parfumées, en grappes",
      fruits: ["Gousses longues (graines)", "30-120cm"],
      bark: "Blanche à grise",
    },
    medicinal: {
      parts: ["feuilles", "fruits", "graines", "racines", "fleurs"],
      properties: ["nutritif", "anti-inflammatoire", "antioxydant", "antibactérien"],
      traditionalUses: ["malnutrition", "anémie", "infections", "diabète"],
      preparation: ["poudre", "décoction", "huile", "infusion"],
    },
    care: {
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement direct",
      soil: "Sol drainé, pauvre à fertile",
      temperature: "20-40°C",
      humidity: "Moyenne",
    },
    blooming: ["janvier", "février", "mars"],
    conservation: "LC",
    imageKeywords: ["moringa", "arbre de vie", "feuilles vertes", "gousses"],
  },
  {
    scientificName: "Azadirachta indica",
    commonNames: ["Neem", "Margousier", "Nim"],
    family: "Meliaceae",
    genus: "Azadirachta",
    species: "indica",
    region: "Afrique Centrale",
    countries: ["Sénégal", "Mali", "Niger", "Tchad", "Soudan", "Éthiopie", "Inde"],
    specialty: "Médicinale",
    description: "Arbre sacré aux propriétés insecticides et médicinales exceptionnelles. Utilisé en agriculture biologique. Toutes parties utiles.",
    characteristics: {
      height: "15-20m",
      trunk: "Écorce grise, profondément fissurée",
      leaves: ["Pennées", "20-30 folioles"],
      flowers: ["Blanches", "parfumées", "en grappes axillaires"],
      fruits: ["Drupes jaunâtres", "1-2cm"],
      bark: "Grise, rugueuse",
    },
    medicinal: {
      parts: ["feuilles", "graines", "écorce", "fleurs"],
      properties: ["insecticide", "antifongique", "antiseptique", "anti-inflammatoire"],
      traditionalUses: ["paludisme", "diabète", "infections", "soins dentaires"],
      preparation: ["décoction", "huile", "poudre", "infusion"],
    },
    care: {
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et drainé",
      temperature: "20-45°C",
      humidity: "Basse",
    },
    blooming: ["avril", "mai", "juin"],
    conservation: "LC",
    imageKeywords: ["neem", "margousier", "feuilles pennées", "arbre médicinal"],
  },
  // Ornementales
  {
    scientificName: "Hibiscus rosa-sinensis",
    commonNames: ["Hibiscus", "Rose de Chine", "Hibiscus rouge"],
    family: "Malvaceae",
    genus: "Hibiscus",
    species: "rosa-sinensis",
    region: "Afrique de l'Ouest",
    countries: ["Sénégal", "Côte d'Ivoire", "Ghana", "Nigeria", "Cameroun"],
    specialty: "Ornementale",
    description: "Arbuste ornemental aux fleurs spectaculaires et éphémères. Très populaire dans les jardins tropicaux.",
    characteristics: {
      height: "2-3m",
      trunk: "Tiges ligneuses, brun rougeâtre",
      leaves: "Lancéolées, dentées, vert brillant",
      flowers: "Grandes, rouges/orangées/roses, 10-15cm",
      fruits: "Capsule",
      bark: "Lisse, brune",
    },
    ornamental: {
      use: "Arbuste d'ornement",
      features: ["Floraison continue", "Fleurs spectaculaires", "Feuillage brillant"],
      parks: ["Jardins", "Haies", "Bacs", "Balcons"],
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct",
      soil: "Sol riche et bien drainé",
      temperature: "15-35°C",
      humidity: "Moyenne à élevée",
    },
    blooming: ["toute l'année"],
    conservation: "LC",
    imageKeywords: ["hibiscus", "fleurs rouges", "jardin tropical", "ornemental"],
  },
  {
    scientificName: "Bougainvillea glabra",
    commonNames: ["Bougainvillée", "Bougainville"],
    family: "Nyctaginaceae",
    genus: "Bougainvillea",
    species: "glabra",
    region: "Afrique Centrale",
    countries: ["Cameroun", "Gabon", "Congo", "RDC"],
    specialty: "Ornementale",
    description: "Liane ornementale aux bractées colorées spectaculaires. Floraison abondante et longue durée.",
    characteristics: {
      height: ["Liane", "5-10m"],
      trunk: "Tiges sarmenteuses, épineuses",
      leaves: "Alternes, ovales, vert foncé",
      flowers: "Bractées colorées (rose, rouge, orange, blanc)",
      fruits: "Akenes",
      bark: " Brune, crevassée",
    },
    ornamental: {
      use: "Liane d'ornement",
      features: ["Floraison abondante", "Bractées colorées", "Croissance rapide"],
      parks: ["Clôtures", "Tonnelles", "Murs", "Jardins"],
    },
    care: {
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et drainé",
      temperature: "20-40°C",
      humidity: "Basse à moyenne",
    },
    blooming: ["toute l'année"],
    conservation: "LC",
    imageKeywords: ["bougainvillée", "bractées roses", "liane", "clôture fleurie"],
  },
  {
    scientificName: "Delonix regia",
    commonNames: ["Flamboyant", "Arbre de feu", "Royal poinciana"],
    family: "Fabaceae",
    genus: "Delonix",
    species: "regia",
    region: "Afrique de l'Est",
    countries: ["Madagascar", "Kenya", "Tanzanie", "Ouganda", "Sénégal"],
    specialty: "Ornementale",
    description: "Arbre spectaculaire à la floraison rouge écarlate. Un des plus beaux arbres ornementaux tropicaux.",
    characteristics: {
      height: "8-12m",
      trunk: "Écorce grise, lisse",
      leaves: ["Bipennées", "10-20 paires de folioles"],
      flowers: ["Rouge écarlate", "en grappes", "10-12cm"],
      fruits: ["Gousses ligneuses", "30-60cm"],
      bark: "Grise, lisse",
    },
    ornamental: {
      use: "Arbre d'ornement",
      features: ["Floraison spectaculaire", "Port parasol", "Feuillage délicat"],
      parks: ["Avenues", "Parcs", "Jardins", "Places publiques"],
    },
    care: {
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol drainé, pauvre",
      temperature: "20-40°C",
      humidity: "Basse",
    },
    blooming: ["décembre", "janvier", "février", "mars"],
    conservation: "LC",
    imageKeywords: ["flamboyant", "fleurs rouges", "arbre tropical", "avenue"],
  },
  {
    scientificName: "Jacaranda mimosifolia",
    commonNames: ["Jacaranda", "Jacaranda bleu", "Faux-cyprès"],
    family: "Bignoniaceae",
    genus: "Jacaranda",
    species: "mimosifolia",
    region: "Afrique du Nord",
    countries: ["Maroc", "Algérie", "Tunisie", "Égypte"],
    specialty: "Ornementale",
    description: "Arbre à la floraison bleu-violet spectaculaire. Très apprécié dans les villes méditerranéennes.",
    characteristics: {
      height: "10-15m",
      trunk: "Écorce grise, rugueuse",
      leaves: ["Bipennées", "similaires à mimosas"],
      flowers: ["Bleu-violet", "en grappes", "4-5cm"],
      fruits: ["Capsule ligneuse", "plate"],
      bark: "Grise, rugueuse",
    },
    ornamental: {
      use: "Arbre d'ornement",
      features: ["Floraison violette", "Feuillage fin", "Port élancé"],
      parks: ["Avenues", "Parcs", "Jardins", "Villes"],
    },
    care: {
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement direct",
      soil: "Sol drainé, fertile",
      temperature: "10-35°C",
      humidity: "Moyenne",
    },
    blooming: ["avril", "mai", "juin"],
    conservation: "LC",
    imageKeywords: ["jacaranda", "fleurs violettes", "avenue", "printemps"],
  },
  // Arbres forestiers
  {
    scientificName: "Entandrophragma cylindricum",
    commonNames: ["Sapelli", "Sapelli mahogany", "Acajou d'Afrique"],
    family: "Meliaceae",
    genus: "Entandrophragma",
    species: "cylindricum",
    region: "Afrique Centrale",
    countries: ["Cameroun", "Gabon", "Congo", "RDC", "Côte d'Ivoire"],
    specialty: "Forestière",
    description: "Grand arbre forestier produisant un bois précieux (acajou d'Afrique). Essence recherchée pour l'ébénisterie.",
    characteristics: {
      height: "30-45m",
      trunk: "Très long, cylindrique, contreforts à la base",
      leaves: ["Composées pennées", "8-12 folioles"],
      flowers: ["Blanches", "odorantes", "en panicules"],
      fruits: ["Capsule ligneuse", "30-50cm"],
      bark: "Grise, rugueuse",
    },
    forestry: {
      wood: "Acajou d'Afrique",
      quality: "Excellente",
      uses: ["ébénisterie", "menuiserie", "construction navale"],
      conservation: "VU (Vulnérable)",
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct",
      soil: "Sol riche et bien drainé",
      temperature: "20-30°C",
      humidity: "Élevée",
    },
    blooming: ["septembre", "octobre", "novembre"],
    conservation: "VU",
    imageKeywords: ["sapelli", "acajou", "grand arbre", "forêt tropicale"],
  },
  {
    scientificName: "Milicia excelsa",
    commonNames: ["Iroko", "Teck africain", "Iroko"],
    family: "Moraceae",
    genus: "Milicia",
    species: "excelsa",
    region: "Afrique Centrale",
    countries: ["Cameroun", "Gabon", "Congo", "RDC", "Côte d'Ivoire", "Ghana"],
    specialty: "Forestière",
    description: "Grand arbre forestier au bois précieux et durable. Symbolise la forêt tropicale africaine.",
    characteristics: {
      height: "25-35m",
      trunk: "Droit, cylindrique, contreforts",
      leaves: ["Alternes", "ovales", "glabres"],
      flowers: ["Vertes", "petites", "en épis"],
      fruits: ["Sycamines", "jaunes"],
      bark: "Grise, rugueuse, s'écaillant",
    },
    forestry: {
      wood: "Iroko",
      quality: "Excellente, durable",
      uses: ["menuiserie", "ébénisterie", "construction", "ponts"],
      conservation: "NT (Quasi menacé)",
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct",
      soil: "Sol riche et bien drainé",
      temperature: "20-30°C",
      humidity: "Élevée",
    },
    blooming: ["janvier", "février", "mars"],
    conservation: "NT",
    imageKeywords: ["iroko", "teck africain", "forêt", "bois précieux"],
  },
  // Alimentaires
  {
    scientificName: "Carica papaya",
    commonNames: ["Papayer", "Papaye", "Pawpaw"],
    family: "Caricaceae",
    genus: "Carica",
    species: "papaya",
    region: "Afrique de l'Ouest",
    countries: ["Sénégal", "Côte d'Ivoire", "Ghana", "Nigeria", "Cameroun"],
    specialty: "Alimentaire",
    description: "Arbre tropical produisant des fruits savoureux et nutritifs. Très cultivé en Afrique tropicale.",
    characteristics: {
      height: "3-10m",
      trunk: "Tige unique, cylindrique, marquée de cicatrices foliaires",
      leaves: ["Palmées", "7-9 lobes"],
      flowers: ["Blanches", "parfumées", "axillaires"],
      fruits: ["Baies charnues", "orange", "15-45cm"],
      bark: "Grise, lisse",
    },
    alimentary: {
      fruit: "Papaye",
      uses: ["frais", "jus", "salade", "confiture"],
      nutritional: ["vitamine C", "vitamine A", "papaine", "fibres"],
      preparation: ["frais", "jus", "sec", "confiture"],
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Ensoleillement direct",
      soil: "Sol drainé, fertile",
      temperature: "20-35°C",
      humidity: "Moyenne à élevée",
    },
    blooming: ["toute l'année"],
    conservation: "LC",
    imageKeywords: ["papayer", "papaye", "fruits orange", "tropical"],
  },
  // Savane
  {
    scientificName: "Vitellaria paradoxa",
    commonNames: ["Karité", "Arbre à beurre", "Shea tree"],
    family: "Sapotaceae",
    genus: "Vitellaria",
    species: "paradoxa",
    region: "Afrique de l'Ouest",
    countries: ["Sénégal", "Mali", "Burkina Faso", "Ghana", "Niger", "Nigeria", "Soudan"],
    specialty: "Médicinale",
    description: "Arbre emblématique de la savane africaine. Produit le beurre de karité, cosmétique et alimentaire de grande qualité.",
    characteristics: {
      height: "10-15m",
      trunk: "Écorce épaisse, rugueuse",
      leaves: ["Alternes", "elliptiques", "vert foncé"],
      flowers: ["Crème", "parfumées", "en grappes"],
      fruits: ["Baies charnues", "jaune verdâtre"],
      bark: " Brune, rugueuse",
    },
    medicinal: {
      parts: ["amandes", "beurre", "écorce", "feuilles"],
      properties: ["émollient", "anti-inflammatoire", "hydratant"],
      traditionalUses: ["peau", "cheveux", "inflammation", "protection solaire"],
      preparation: ["beurre", "huile", "pommade", "savon"],
    },
    care: {
      watering: "Très résistant à la sécheresse",
      sunlight: "Ensoleillement direct",
      soil: "Sol pauvre et drainé",
      temperature: "25-45°C",
      humidity: "Basse",
    },
    blooming: ["avril", "mai", "juin"],
    conservation: "LC",
    imageKeywords: ["karité", "beurre karité", "savane", "arbre africain"],
  },
  // Montagnardes
  {
    scientificName: "Podocarpus latifolius",
    commonNames: ["Podocarpus", "Pin de l'Est", "Yellowwood"],
    family: "Podocarpaceae",
    genus: "Podocarpus",
    species: "latifolius",
    region: "Afrique de l'Est",
    countries: ["Kenya", "Tanzanie", "Ouganda", "Rwanda", "Burundi", "Éthiopie"],
    specialty: "Forestière",
    description: "Conifère endémique des montagnes d'Afrique de l'Est. Bois précieux utilisé en ébénisterie.",
    characteristics: {
      height: "20-30m",
      trunk: "Droit, cylindrique, écorce grise",
      leaves: ["Persistantes", "linéaires-lancéolées"],
      flowers: ["Cônes mâles", "jaunes", "cônes femelles"],
      fruits: ["Drupes charnues", "rouges"],
      bark: "Grise, rugueuse",
    },
    forestry: {
      wood: "Yellowwood",
      quality: "Bonne",
      uses: ["ébénisterie", "menuiserie", "construction"],
      conservation: "LC",
    },
    care: {
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement direct à partiel",
      soil: "Sol riche et bien drainé",
      temperature: "10-25°C",
      humidity: "Moyenne",
    },
    blooming: ["septembre", "octobre"],
    conservation: "LC",
    imageKeywords: ["podocarpus", "conifère", "montagne", "forêt montagnarde"],
  },
  // Désertiques
  {
    scientificName: "Pachypodium lamerei",
    commonNames: ["Pachypode de Lamerei", "Madagascar palm", "Palmier de Madagascar"],
    family: "Apocynaceae",
    genus: "Pachypodium",
    species: "lamerei",
    region: "Afrique du Nord",
    countries: ["Madagascar"],
    specialty: "Ornementale",
    description: "Plante succulente spectaculaire originaire de Madagascar. Très prisée des collectionneurs.",
    characteristics: {
      height: "4-6m",
      trunk: "Épais, charnu, gris argenté, épines",
      leaves: ["Persistantes", "vert foncé", "linéaires"],
      flowers: ["Blanches", "parfumées", "en grappes"],
      fruits: ["Capsules", "2"],
      bark: "Grise, lisse",
    },
    ornamental: {
      use: "Plante succulente d'ornement",
      features: ["Port spectaculaire", "Épines", "Floraison parfumée"],
      parks: ["Collections", "Jardins secs", "Cactus"],
    },
    care: {
      watering: "Arrosage rare",
      sunlight: "Ensoleillement direct",
      soil: "Sol très drainé, minéral",
      temperature: "20-40°C",
      humidity: "Basse",
    },
    blooming: ["mai", "juin", "juillet"],
    conservation: "LC",
    imageKeywords: ["pachypodium", "succulente", "madagascar", "épines"],
  },
  // Aquatiques
  {
    scientificName: "Nymphaea caerulea",
    commonNames: ["Lotus bleu", "Nénuphar bleu", "Blue lotus"],
    family: "Nymphaeaceae",
    genus: "Nymphaea",
    species: "caerulea",
    region: "Afrique de l'Est",
    countries: ["Égypte", "Éthiopie", "Kenya", "Tanzanie", "Ouganda"],
    specialty: "Médicinale",
    description: "Nénuphar sacré des Égyptiens anciens. Propriétés médicinales et psychotropes reconnues.",
    characteristics: {
      height: ["Flottant", "10-30cm"],
      trunk: "Rhizomes charnus",
      leaves: ["Flottantes", "circulaires", "30-40cm"],
      flowers: ["Bleu ciel", "parfumées", "10-15cm"],
      fruits: ["Baies", "flottantes"],
      bark: "N/A",
    },
    medicinal: {
      parts: ["fleurs", "rhizomes", "feuilles"],
      properties: ["sédatif", "aphrodisiaque", "antispasmodique"],
      traditionalUses: ["anxiété", "insomnie", "douleur", "euphorie"],
      preparation: ["infusion", "décoction", "vin médicinal"],
    },
    care: {
      watering: "Aquatique",
      sunlight: "Ensoleillement direct",
      soil: "Sol aquatique, vaseux",
      temperature: "20-35°C",
      humidity: "Élevée",
    },
    blooming: ["mai", "juin", "juillet", "août"],
    conservation: "LC",
    imageKeywords: ["lotus bleu", "nénuphar", "fleur aquatique", "égypte"],
  },
  // Épices et aromatiques
  {
    scientificName: "Zingiber officinale",
    commonNames: ["Gingembre", "Ginger"],
    family: "Zingiberaceae",
    genus: "Zingiber",
    species: "officinale",
    region: "Afrique de l'Ouest",
    countries: ["Ghana", "Nigeria", "Côte d'Ivoire", "Sénégal"],
    specialty: "Médicinale",
    description: "Rhizome aromatique et médicinal. Utilisé comme épice et en médecine traditionnelle.",
    characteristics: {
      height: "0.5-1.5m",
      trunk: "Rhizome souterrain, charnu",
      leaves: ["Lancéolées", "vert brillant", "20-25cm"],
      flowers: ["Jaunes-vertes", "en grappes"],
      fruits: "Capsule",
      bark: "N/A",
    },
    medicinal: {
      parts: ["rhizomes", "feuilles"],
      properties: ["anti-inflammatoire", "antioxydant", "digestif", "antinauséeux"],
      traditionalUses: ["nausées", "douleurs", "digestion", "rhume"],
      preparation: ["infusion", "poudre", "décoction", "huile"],
    },
    alimentary: {
      uses: ["épice", "thé", "cuisine", "confiserie"],
      flavor: "Piquant, aromatique",
    },
    care: {
      watering: "Arrosage régulier",
      sunlight: "Lumière indirecte",
      soil: "Sol riche et drainé",
      temperature: "20-30°C",
      humidity: "Élevée",
    },
    blooming: ["toute l'année"],
    conservation: "LC",
    imageKeywords: ["gingembre", "rhizome", "épice", "plante aromatique"],
  },
  {
    scientificName: "Cinnamomum verum",
    commonNames: ["Cannelle", "Cinnamon", "Cannelle de Ceylan"],
    family: "Lauraceae",
    genus: "Cinnamomum",
    species: "verum",
    region: "Afrique du Nord",
    countries: ["Madagascar", "Seychelles", "Maurice"],
    specialty: "Médicinale",
    description: "Arbre produisant l'écorce de cannelle, épice précieuse. Propriétés médicinales reconnues.",
    characteristics: {
      height: "10-15m",
      trunk: "Écorce brun-rougeâtre, aromatique",
      leaves: ["Opposées", "elliptiques", "vert brillant"],
      flowers: ["Blanches", "parfumées", "en panicules"],
      fruits: ["Baies", "noires"],
      bark: "Brun-rougeâtre, aromatique",
    },
    medicinal: {
      parts: ["écorce", "feuilles", "huile"],
      properties: ["antiseptique", "anti-inflammatoire", "antioxydant", "digestif"],
      traditionalUses: ["digestion", "diabète", "infections", "circulation"],
      preparation: ["poudre", "infusion", "huile", "décoction"],
    },
    alimentary: {
      uses: ["épice", "boulangerie", "boissons", "pharmacie"],
      flavor: "Doux, aromatique, sucré",
    },
    care: {
      watering: "Arrosage modéré",
      sunlight: "Ensoleillement partiel",
      soil: "Sol riche et drainé",
      temperature: "20-30°C",
      humidity: "Élevée",
    },
    blooming: ["janvier", "février", "mars"],
    conservation: "LC",
    imageKeywords: ["cannelle", "écorce", "épice", "aromatique"],
  },
];

async function main() {
  console.log("Starting comprehensive AI training data generation...");

  // Get demo user
  const demoUser = await prisma.user.findFirst({
    where: { email: "demo@botanique.app" },
  });

  if (!demoUser) {
    console.error("Demo user not found. Please run seed.ts first.");
    process.exit(1);
  }

  let totalTrainingExamples = 0;
  let totalModelVersions = 0;

  for (const species of botanicalSpecies) {
    console.log(`Processing: ${species.commonNames[0]} (${species.scientificName})`);

    // Create plant in database if not exists
    const plant = await prisma.plant.upsert({
      where: { scientificName: species.scientificName },
      update: {
        commonNames: JSON.stringify(species.commonNames),
        family: species.family,
        genus: species.genus,
        species: species.species,
        description: species.description,
        taxonomy: JSON.stringify({
          kingdom: "Plantae",
          family: species.family,
          genus: species.genus,
          species: species.species,
        }),
        medicinal: species.medicinal ? true : false,
        edibleParts: JSON.stringify(species.alimentary?.uses || species.medicinal?.parts || []),
        toxicity: JSON.stringify([]),
        watering: species.care.watering,
        sunlight: species.care.sunlight,
        soil: species.care.soil,
        growthRate: "Moyen",
        imageUrl: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}`,
        gbifId: Math.random().toString(36).substring(7),
      },
      create: {
        scientificName: species.scientificName,
        commonNames: JSON.stringify(species.commonNames),
        family: species.family,
        genus: species.genus,
        species: species.species,
        description: species.description,
        taxonomy: JSON.stringify({
          kingdom: "Plantae",
          family: species.family,
          genus: species.genus,
          species: species.species,
        }),
        medicinal: species.medicinal ? true : false,
        edibleParts: JSON.stringify(species.alimentary?.uses || species.medicinal?.parts || []),
        toxicity: JSON.stringify([]),
        watering: species.care.watering,
        sunlight: species.care.sunlight,
        soil: species.care.soil,
        growthRate: "Moyen",
        imageUrl: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}`,
        gbifId: Math.random().toString(36).substring(7),
      },
    });

    // Generate multiple training examples for each species
    const variations = [
      { label: species.commonNames[0], confidence: 0.95 },
      { label: species.commonNames[1] || species.commonNames[0], confidence: 0.88 },
      { label: species.scientificName, confidence: 0.92 },
      { label: species.family, confidence: 0.75 },
    ];

    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      await prisma.trainingData.create({
        data: {
          userId: demoUser.id,
          plantName: species.commonNames[0],
          label: variation.label,
          scientificName: species.scientificName,
          imageUrl: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}`,
          confidence: variation.confidence,
          isVerified: true,
          usedForTraining: true,
          metadata: {
            region: species.region,
            countries: species.countries,
            specialty: species.specialty,
            family: species.family,
            characteristics: species.characteristics,
            medicinal: species.medicinal,
            ornamental: species.ornamental,
            forestry: species.forestry,
            alimentary: species.alimentary,
            care: species.care,
            blooming: species.blooming,
            conservation: species.conservation,
            imageKeywords: species.imageKeywords,
            variationIndex: i,
          },
        },
      });
      totalTrainingExamples++;
    }

    // Create disease associations
    const diseases = await prisma.disease.findMany();
    for (let i = 0; i < Math.min(diseases.length, 2); i++) {
      await prisma.plantDisease.upsert({
        where: {
          plantId_diseaseId: {
            plantId: plant.id,
            diseaseId: diseases[i].id,
          },
        },
        update: {},
        create: {
          plantId: plant.id,
          diseaseId: diseases[i].id,
          confidence: 0.5 + Math.random() * 0.4,
        },
      });
    }
  }

  // Create multiple model versions to simulate training history
  const modelVersions = [
    { version: "v1.0.0", name: "Initial Model", accuracy: 0.75, loss: 0.45, status: "ARCHIVED" as const },
    { version: "v1.1.0", name: "Improved with 10 species", accuracy: 0.82, loss: 0.32, status: "ARCHIVED" as const },
    { version: "v1.2.0", name: "Added regional data", accuracy: 0.87, loss: 0.25, status: "ARCHIVED" as const },
    { version: "v1.3.0", name: "Enhanced metadata", accuracy: 0.91, loss: 0.18, status: "READY" as const },
    { version: "v2.0.0", name: "Current production model", accuracy: 0.94, loss: 0.12, status: "DEPLOYED" as const },
  ];

  for (const mv of modelVersions) {
    await prisma.modelVersion.upsert({
      where: { version: mv.version },
      update: {},
      create: {
        ...mv,
        trainingDataCount: totalTrainingExamples,
        description: `${mv.name} - Entraîné sur ${totalTrainingExamples} exemples avec ${botanicalSpecies.length} espèces`,
      },
    });
    totalModelVersions++;
  }

  console.log(`\n✅ Training data generation complete!`);
  console.log(`   - ${botanicalSpecies.length} species processed`);
  console.log(`   - ${totalTrainingExamples} training examples created`);
  console.log(`   - ${totalModelVersions} model versions created`);
  console.log(`   - Regions covered: ${[...new Set(botanicalSpecies.map(s => s.region))].join(", ")}`);
  console.log(`   - Specialties: ${[...new Set(botanicalSpecies.map(s => s.specialty))].join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
