/**
 * Ajoute les espèces à spécialité manquantes + localités natives GBIF (plage d'origine).
 * Usage: npx tsx prisma/add-missing-specialty.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GBIF = "https://api.gbif.org/v1/species/match";

const MISSING: Record<string, { commonNames: string[]; description: string; specialty: string; height: string; leaves: string; flowers: string; fruits: string; care: string; blooming: string[] }> = {
  "Butyrospermum parkii": { commonNames: ["Karité", "Arbre à beurre", "Shea tree"], description: "Arbre sacré d'Afrique de l'Ouest produisant les amandes de karité, base du beurre de karité. Arbre à vocation alimentaire et cosmétique, très important économiquement.", specialty: "Alimentaire", height: "10-15m", leaves: "Oblongues, pubescentes", flowers: "Blanches crème, parfumées", fruits: "Baies contenant l'amande à karité", care: "Sol sec sablo-argileux, résistante à la sécheresse", blooming: ["juin", "juillet"] },
  "Parkia biglobosa": { commonNames: ["Néré", "Arbre à faïne", "African locust bean"], description: "Arbre à vocation alimentaire majeure : ses graines fermentées donnent le 'néré' ou 'soumbala', condiment traditionnel africain riche en protéines.", specialty: "Alimentaire", height: "10-20m", leaves: "Bipennées, 13-36 paires", flowers: "Rouge foncé, en épis globuleux", fruits: "Gousses à pulpe fermentable", care: "Sol pauvre sablonneux, résistante à la sécheresse", blooming: ["novembre", "décembre", "janvier"] },
  "Tamarindus indica": { commonNames: ["Tamarinier", "Tamarind", "Dakar"], description: "Arbre emblématique d'Afrique de l'Ouest : ses gousses à pulpe acidulée sont utilisées en cuisine (boissons, sauces), en médecine traditionnelle et en menuiserie.", specialty: "Alimentaire", height: "12-18m", leaves: "Pennées, 10-20 paires de folioles", flowers: "Jaune strié de rouge", fruits: "Gousses brunes à pulpe acidulée", care: "Sol varié, résistante à la sécheresse", blooming: ["août", "septembre", "octobre"] },
  "Mangifera indica": { commonNames: ["Manguier", "Mango tree"], description: "Arbre fruitier tropical majeur : le manguier donne le fruit le plus consommé au monde. Originaire d'Asie du Sud, il s'est largement acclimaté en Afrique.", specialty: "Alimentaire", height: "10-30m", leaves: "Alternes, lancéolées, coriaces", flowers: "Jaunâtres, en panicules terminaux", fruits: "Drupe charnue, jaune-rouge", care: "Sol profond drainé, arrosage régulier", blooming: ["décembre", "janvier", "février"] },
  "Anacardium occidentale": { commonNames: ["Anacardier", "Pommier-cajou", "Cashew tree"], description: "Arbre tropical produisant les noix de cajou et la pomme de cajou. Culture majeure d'Afrique de l'Ouest, très importante économiquement.", specialty: "Alimentaire", height: "6-12m", leaves: "Alternes, obovales, coriaces", flowers: "Jaunâtres rosées, en panicules", fruits: "Noix en crochets + fausse pomme", care: "Sol sableux drainé, côtières tolérées", blooming: ["janvier", "février", "mars"] },
  "Khaya senegalensis": { commonNames: ["Caïlcédrat", "Acajou du Sénégal", "Bdiss"], description: "Grand arbre forestier d'Afrique de l'Ouest, proche de l'acajou. Bois précieux, écorce médicinale. Espèce emblématique des savanes sahéliennes.", specialty: "Forestière", height: "25-35m", leaves: "Pennées, 4-6 paires de folioles", flowers: "Blanches-crème, en panicules", fruits: "Capsules ligneuses 4-6cm", care: "Sol profond, ripisylves, savanes", blooming: ["septembre", "octobre"] },
  "Entandrophragma angolense": { commonNames: ["Tiangoma", "Acajou à petites feuilles"], description: "Grand arbre forestier d'Afrique centrale et occidentale. Bois précieux utilisé en ébénisterie. Espèce de la canopée tropicale humide.", specialty: "Forestière", height: "45-55m", leaves: "Pennées, 8-12 paires", flowers: "Blanches-crème, petites", fruits: "Capsules à 5 ailes", care: "Forêt humide tropicale", blooming: ["avril", "mai"] },
  "Pterocarpus angolensis": { commonNames: ["Mukwa", "Padouk d'Afrique", "Bloodwood tree"], description: "Arbre forestier au bois rouge précieux (padouk). La sève rouge vif lui donne son nom anglais. Espèce menacée par la surexploitation.", specialty: "Forestière", height: "15-25m", leaves: "Pennées imparipennées", flowers: "Orange-jaune vif, en grappes", fruits: "Gousses ailées circulaires", care: "Savane sèche, sol sablonneux", blooming: ["août", "septembre"] },
  "Aframomum melegueta": { commonNames: ["Graine de Paradis", "Malaguette", "Maniguette"], description: "Herbe aromatique d'Afrique de l'Ouest dont les graines (graines de Paradis) servaient d'épice précieuse au Moyen Âge. Propriétés médicinales reconnues.", specialty: "Médicinale", height: "1-2m", leaves: "Longues, lancéolées, alternes", flowers: "Blanches à lèvre rouge", fruits: "Capsules rouges à graines aromatiques", care: "Sous-bois humide, sol riche", blooming: ["juin", "juillet"] },
};


async function fetchWithRetry(url: string, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "TERRA/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 5000 * (i + 1)));
      continue;
    }
    return r;
  }
  return null;
}

// Occurrence GBIF minimale utilisée ici (l'API renvoie bien plus de champs)
interface Occ {
  country?: string;
}

// Pays des observations réelles (occurrences géolocalisées)
async function getOccCountries(scientificName: string) {
  try {
    const params = new URLSearchParams({
      scientificName,
      hasCoordinate: "true",
      limit: "300",
    });
    const r = await fetchWithRetry(`https://api.gbif.org/v1/occurrence/search?${params}`);
    if (!r || !r.ok) return [];
    const d = await r.json();
    return ((d.results || []) as Occ[]).filter((o) => o.country).map((o) => o.country!);
  } catch {
    return [];
  }
}

async function getNativeRange(scientificName: string) {
  try {
    const match = await fetch(`${GBIF}?name=${encodeURIComponent(scientificName)}&kingdom=Plantae`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!match.ok) return [];
    const m = await match.json();
    if (!m.acceptedUsageKey) return [];
    const r = await fetch(`https://api.gbif.org/v1/species/${m.acceptedUsageKey}/distributions`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []) as Array<{ country?: string; continent?: string; establishmentMeans?: string }>;
  } catch {
    return [];
  }
}

async function main() {
  // 1. Ajout des espèces manquantes avec localités natives
  for (const [scientificName, info] of Object.entries(MISSING)) {
    const ranges = await getNativeRange(scientificName);
    const occCountries = await getOccCountries(scientificName);
    // Préfère les aires natives ; découpe les chaînes multi-pays ; merge avec observations
    const placeOf = (r: { country?: string; locality?: string }) => r.country || r.locality;
    const native = ranges.filter((r) => r.establishmentMeans === "NATIVE" && placeOf(r));
    const all = ranges.filter((r) => placeOf(r));
    const split = (s: string) => s.split(";").map((x) => x.trim().replace(/\s*\[.*?\]\s*$/, "")).filter((x) => x.length < 60);
    const chosen = ((native.length > 0 ? native : all).map(placeOf) as string[]).flatMap(split);
    const nativeCountries = [...new Set([...occCountries, ...chosen])];

    const characteristics = {
      specialty: info.specialty,
      height: info.height,
      leaves: info.leaves,
      flowers: info.flowers,
      fruits: info.fruits,
      care: info.care,
      blooming: info.blooming,
      nativeCountries: [...new Set(nativeCountries)].slice(0, 30),
    };

    await prisma.plant.upsert({
      where: { scientificName },
      update: { taxonomy: JSON.stringify(characteristics), description: info.description, watering: info.care, medicinal: info.specialty === "Médicinale" },
      create: {
        scientificName,
        commonNames: JSON.stringify(info.commonNames),
        description: info.description,
        family: scientificName.includes("Butyrospermum") || scientificName.includes("Vitellaria") ? "Sapotaceae" : undefined,
        taxonomy: JSON.stringify(characteristics),
        watering: info.care,
        medicinal: info.specialty === "Médicinale",
      },
    });
    console.log(`  🌱 ${scientificName} — ${nativeCountries.length} pays natifs GBIF`);
  }

  // 2. Ajout localités natives pour TOUTES les espèces à spécialité
  const ALL = [...Object.keys(MISSING)];
  const enrichedPlants = await prisma.plant.findMany({
    where: { taxonomy: { contains: '"specialty"' } },
    select: { id: true, scientificName: true, taxonomy: true },
  });
  console.log(`\n📍 Ajout des localités natives pour ${enrichedPlants.length} plantes à spécialité...`);

  for (const plant of enrichedPlants) {
    if (ALL.includes(plant.scientificName)) continue; // déjà fait au-dessus
    const ranges = await getNativeRange(plant.scientificName);
    const occCountries = await getOccCountries(plant.scientificName);
    const placeOf = (r: { country?: string; locality?: string }) => r.country || r.locality;
    const native = ranges.filter((r) => r.establishmentMeans === "NATIVE" && placeOf(r));
    const all = ranges.filter((r) => placeOf(r));
    const split = (s: string) => s.split(";").map((x) => x.trim().replace(/\s*\[.*?\]\s*$/, "")).filter((x) => x.length < 60);
    const chosen = ((native.length > 0 ? native : all).map(placeOf) as string[]).flatMap(split);
    const nativeCountries = [...new Set([...occCountries, ...chosen])].slice(0, 40);
    if (nativeCountries.length === 0) continue;

    let taxonomy: Record<string, unknown> = {};
    try { taxonomy = JSON.parse(plant.taxonomy || "{}"); } catch { /* ignore */ }
    taxonomy.nativeCountries = nativeCountries;

    await prisma.plant.update({
      where: { id: plant.id },
      data: { taxonomy: JSON.stringify(taxonomy) },
    });
    console.log(`  ✅ ${plant.scientificName} — ${nativeCountries.length} pays natifs`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n✅ Terminé");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
