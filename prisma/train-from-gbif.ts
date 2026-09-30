/**
 * Génère des données d'entraînement RÉELLES pour toutes les plantes de la base.
 * - Images : photos réelles d'observations (via GBIF occurrence media)
 * - Labels : noms scientifiques + noms vernaculaires réels
 * Usage: npx tsx prisma/train-from-gbif.ts [maxParEspece]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GBIF_OCC = "https://api.gbif.org/v1/occurrence/search";

async function getRealImages(scientificName: string, max: number) {
  const params = new URLSearchParams({
    scientificName,
    mediaType: "StillImage",
    hasCoordinate: "true",
    limit: String(max),
  });
  try {
    const r = await fetch(`${GBIF_OCC}?${params}`, {
      headers: { Accept: "application/json", "User-Agent": "TERRA/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const urls: string[] = [];
    for (const occ of d.results || []) {
      for (const m of occ.media || []) {
        if (m.type === "StillImage" && m.identifier) urls.push(m.identifier);
      }
      if (urls.length >= max) break;
    }
    return urls;
  } catch {
    return [];
  }
}

async function main() {
  const maxImages = parseInt(process.argv[2] || "2", 10);
  const plants = await prisma.plant.findMany({
    where: { OR: [{ imageUrl: null }, { imageUrl: { contains: "unsplash" } }] },
    select: { id: true, scientificName: true, commonNames: true },
    take: 3000,
  });
  console.log(`🧠 Entraînement réel — ${plants.length} plantes à traiter, ${maxImages} image(s) réelle(s) max par plante`);

  const demoUser = await prisma.user.findUnique({ where: { email: "demo@botanique.app" } });

  let processed = 0;
  let trainingRows = 0;

  for (const plant of plants) {
    const images = await getRealImages(plant.scientificName, maxImages);
    if (images.length > 0) {
      await prisma.plant.update({
        where: { id: plant.id },
        data: { imageUrl: images[0] },
      });

      let commonNames: string[] = [];
      try {
        commonNames = JSON.parse(plant.commonNames || "[]");
      } catch { /* ignore */ }

      for (let i = 0; i < images.length; i++) {
        await prisma.trainingData.create({
          data: {
            userId: demoUser?.id,
            plantName: commonNames[0] || plant.scientificName,
            scientificName: plant.scientificName,
            label: i === 0 ? plant.scientificName : commonNames[0] || plant.scientificName,
            imageUrl: images[i],
            isVerified: true,
            usedForTraining: false, // réservé au prochain entraînement TensorFlow
            metadata: { source: "gbif", occurrenceIndex: i },
          },
        });
        trainingRows++;
      }
      processed++;
    }
    // Délai de courtoisie GBIF
    await new Promise((r) => setTimeout(r, 200));
    if (processed % 50 === 0 && processed > 0) {
      console.log(`  ⏳ ${processed}/${plants.length} plantes traitées...`);
    }
  }

  console.log(`\n✅ Terminé :`);
  console.log(`   - ${processed} plantes avec images réelles`);
  console.log(`   - ${trainingRows} exemples d'entraînement réels créés`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
