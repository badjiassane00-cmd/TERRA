/**
 * Enrichit les plantes à spécialité (médicinales, ornementales, alimentaires, forestières)
 * avec : vraie image GBIF, caractéristiques botaniques, localités réelles (pays + coordonnées).
 * Usage: npx tsx prisma/enrich-specialty.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GBIF_OCC = "https://api.gbif.org/v1/occurrence/search";

// Caractéristiques détaillées des 22 espèces à spécialité (source : train-ai.ts)
const SPECIALTY: Record<string, { specialty: string; height: string; leaves: string; flowers: string; fruits: string; care: string; blooming: string[] }> = {
  "Adansonia digitata": { specialty: "Médicinale", height: "15-25m", leaves: "Composées palmées, 5-7 folioles", flowers: "Blanches, odorantes, nocturnes", fruits: "Baies ligneuses, pulpe blanche acidulée", care: "Sol sablonneux drainé, plein soleil, 20-40°C", blooming: ["juin", "juillet", "août"] },
  "Spathodea campanulata": { specialty: "Ornementale", height: "7-15m", leaves: "Composées pennées, 7-19 folioles", flowers: "Rouge-orangé, en tulipe, 8-10cm", fruits: "Capsule ligneuse, 15-20cm", care: "Sol riche drainé, soleil direct, 20-35°C", blooming: ["mars", "avril", "mai"] },
  "Acacia senegal": { specialty: "Médicinale", height: "5-12m", leaves: "Bipennées, 4-8 paires de pinnules", flowers: "Blanc-jaunâtre, en épis", fruits: "Gousses plates, 7-12cm", care: "Sol pauvre sablonneux, très résistante à la sécheresse", blooming: ["septembre", "octobre", "novembre"] },
  "Olea europaea subsp. cuspidata": { specialty: "Médicinale", height: "8-15m", leaves: "Opposées, lancéolées, vert sombre", flowers: "Blanches, petites, odorantes", fruits: "Drupes ovales, vertes puis noires", care: "Sol calcaire drainé, arrosage rare, 10-40°C", blooming: ["avril", "mai", "juin"] },
  "Moringa oleifera": { specialty: "Médicinale", height: "5-10m", leaves: "Tripennées, folioles ovales", flowers: "Blanches-crème, odorantes", fruits: "Gousses pendantes triangulaires 30-45cm", care: "Sol drainé, résistante à la sécheresse", blooming: ["toute l'année"] },
  "Azadirachta indica": { specialty: "Médicinale", height: "15-20m", leaves: "Pennées, 8-19 folioles dentées", flowers: "Blanches, en panicules axillaires", fruits: "Drupes olives jaunes", care: "Sol pauvre toléré, plein soleil", blooming: ["février", "mars", "avril"] },
  "Hibiscus rosa-sinensis": { specialty: "Ornementale", height: "2-5m", leaves: "Ovales, dentées, brillantes", flowers: "Trompette 10-15cm, rouges/roses", fruits: "Capsule rare en culture", care: "Sol riche humide, plein soleil", blooming: ["toute l'année"] },
  "Bougainvillea glabra": { specialty: "Ornementale", height: "Liane 5-12m", leaves: "Alternes, ovales-lancéolées", flowers: "Tubulaires blanches entourées de bractées colorées", fruits: "Achène à 5 loges", care: "Sol drainé, plein soleil, résistante à la sécheresse", blooming: ["toute l'année en climat chaud"] },
  "Delonix regia": { specialty: "Ornementale", height: "8-12m", leaves: "Bipennées, folioles fins", flowers: "Rouge écarlate, grandes, en grappes", fruits: "Gousse plates ligneuse jusqu'à 60cm", care: "Sol drainé, plein soleil, arrosage espacé", blooming: ["avril", "mai", "juin"] },
  "Jacaranda mimosifolia": { specialty: "Ornementale", height: "10-15m", leaves: "Bipennées, folioles menues", flowers: "Bleu-violet, en panicules", fruits: "Capsule ronde ligneuse", care: "Sol drainé, plein soleil", blooming: ["mai", "juin", "juillet"] },
  "Butyrospermum parkii": { specialty: "Alimentaire", height: "10-15m", leaves: "Oblongues, pubescentes", flowers: "Blanches crème, parfumées", fruits: "Baies contenant l'amande à karité", care: "Sol sec sablo-argileux, résistante à la sécheresse", blooming: ["juin", "juillet"] },
  "Parkia biglobosa": { specialty: "Alimentaire", height: "10-20m", leaves: "Bipennées, 13-36 paires", flowers: "Rouge foncé, en épis globuleux", fruits: "Gousses contenant la pulpe fermentable (néré)", care: "Sol pauvre sablonneux, résistante à la sécheresse", blooming: ["novembre", "décembre", "janvier"] },
  "Tamarindus indica": { specialty: "Alimentaire", height: "12-18m", leaves: "Pennées, 10-20 paires de folioles", flowers: "Jaune strié de rouge", fruits: "Gousses brunes à pulpe acidulée", care: "Sol varié, résistante à la sécheresse", blooming: ["août", "septembre", "octobre"] },
  "Carica papaya": { specialty: "Alimentaire", height: "3-10m", leaves: "Palmées, 7-9 lobes", flowers: "Blanches, parfumées, axillaires", fruits: "Baies charnues orange 15-45cm", care: "Sol drainé fertile, arrosage régulier", blooming: ["toute l'année"] },
  "Mangifera indica": { specialty: "Alimentaire", height: "10-30m", leaves: "Alternes, lancéolées, coriaces", flowers: "Jaunâtres, en panicules terminaux", fruits: "Drupe charnue, jaune-rouge", care: "Sol profond drainé, arrosage régulier en croissance", blooming: ["décembre", "janvier", "février"] },
  "Anacardium occidentale": { specialty: "Alimentaire", height: "6-12m", leaves: "Alternes, obovales, coriaces", flowers: "Jaunâtres rosées, en panicules", fruits: "Noix en crochets + fausse pomme", care: "Sol sableux drainé, côtières tolérées", blooming: ["janvier", "février", "mars"] },
  "Khaya senegalensis": { specialty: "Forestière", height: "25-35m", leaves: "Pennées, 4-6 paires de folioles", flowers: "Blanches-crème, en panicules", fruits: "Capsules ligneuses 4-6cm", care: "Sol profond, ripisylves, savanes", blooming: ["septembre", "octobre"] },
  "Entandrophragma angolense": { specialty: "Forestière", height: "45-55m", leaves: "Pennées, 8-12 paires", flowers: "Blanches-crème, petites", fruits: "Capsules à 5 ailes", care: "Forêt humide tropicale", blooming: ["avril", "mai"] },
  "Entandrophragma cylindricum": { specialty: "Forestière", height: "50-65m", leaves: "Pennées, 6-10 paires", flowers: "Jaunâtres, petites", fruits: "Capsules cylindriques à ailes", care: "Forêt ombrophile", blooming: ["janvier", "février"] },
  "Milicia excelsa": { specialty: "Forestière", height: "25-35m", leaves: "Alternes, ovales, glabres", flowers: "Vertes, petites, en épis", fruits: "Sycamines jaunes", care: "Forêt dense humide", blooming: ["janvier", "février", "mars"] },
  "Pterocarpus angolensis": { specialty: "Forestière", height: "15-25m", leaves: "Pennées imparipennées", flowers: "Orange-jaune vif, en grappes", fruits: "Gousses ailées circulaires", care: "Savane sèche, sol sablonneux", blooming: ["août", "septembre"] },
  "Cinnamomum verum": { specialty: "Médicinale", height: "10-15m", leaves: "Opposées, ovales, brillantes", flowers: "Jaune-vert, petites", fruits: "Baies noir-bleu", care: "Climat humide tropical, sol riche", blooming: ["janvier", "février", "mars"] },
};

interface Occ {
  country?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  stateProvince?: string;
  locality?: string;
  media?: Array<{ type: string; identifier?: string }>;
}

async function getGbifData(scientificName: string) {
  const params = new URLSearchParams({
    scientificName,
    mediaType: "StillImage",
    hasCoordinate: "true",
    limit: "50",
  });
  const r = await fetch(`${GBIF_OCC}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "TERRA/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  const results = (d.results || []) as Occ[];
  const image = results.flatMap((o) => (o.media || []).map((m) => m.identifier)).filter(Boolean)[0] as string | undefined;
  const countries = new Map<string, { lat: number; lng: number; state?: string; locality?: string }>();
  for (const occ of results) {
    if (occ.country && occ.decimalLatitude != null && occ.decimalLongitude != null && !countries.has(occ.country)) {
      countries.set(occ.country, {
        lat: occ.decimalLatitude,
        lng: occ.decimalLongitude,
        state: occ.stateProvince,
        locality: occ.locality,
      });
    }
  }
  return { image, countries: Array.from(countries.entries()) };
}

async function main() {
  console.log(`🌿 Enrichissement des plantes à spécialité — ${Object.keys(SPECIALTY).length} espèces`);

  for (const [scientificName, info] of Object.entries(SPECIALTY)) {
    const gbif = await getGbifData(scientificName);
    const plant = await prisma.plant.findUnique({
      where: { scientificName },
      include: { locations: { include: { location: true } } },
    });
    if (!plant) {
      console.log(`  ⚠️ ${scientificName} absente de la base`);
      continue;
    }

    // 1. Image réelle si disponible
    const imageUrl = gbif?.image || plant.imageUrl;

    // 2. Caractéristiques dans le champ taxonomy (JSON structuré)
    const characteristics = {
      specialty: info.specialty,
      height: info.height,
      leaves: info.leaves,
      flowers: info.flowers,
      fruits: info.fruits,
      care: info.care,
      blooming: info.blooming,
    };

    await prisma.plant.update({
      where: { id: plant.id },
      data: {
        imageUrl,
        taxonomy: JSON.stringify(characteristics),
        watering: info.care,
        medicinal: info.specialty === "Médicinale",
      },
    });

    // 3. Localités réelles : une Location par pays d'observation
    let newLocations = 0;
    for (const [country, geo] of gbif?.countries || []) {
      const existing = await prisma.location.findFirst({ where: { name: country } });
      const location = existing
        ? undefined
        : await prisma.location.create({
            data: {
              name: country,
              lat: geo.lat,
              lng: geo.lng,
              region: country,
              type: "RESERVE",
              description: geo.locality || geo.state || `Observation réelle de ${scientificName}`,
              bloomingMonths: JSON.stringify(info.blooming),
            },
          });
      const locId = existing?.id || location?.id;
      if (!locId) continue;
      await prisma.locationPlant.upsert({
        where: { locationId_plantId: { locationId: locId, plantId: plant.id } },
        update: {},
        create: { locationId: locId, plantId: plant.id },
      });
      newLocations++;
    }

    console.log(
      `  ✅ ${scientificName} — image: ${imageUrl ? "OK" : "absente"}, caractéristiques: OK, localités: +${newLocations} (${gbif?.countries.length || 0} pays)`
    );
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Enrichissement terminé`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
