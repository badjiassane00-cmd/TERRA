/**
 * Récupère une vraie image GBIF pour les plantes à spécialité qui n'en ont pas.
 * Usage: npx tsx prisma/fix-specialty-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchWithRetry(url: string, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "SunuNature/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 6000 * (i + 1)));
      continue;
    }
    return r.ok ? r : null;
  }
  return null;
}

async function getImage(scientificName: string): Promise<string | null> {
  const params = new URLSearchParams({
    scientificName,
    mediaType: "StillImage",
    hasCoordinate: "true",
    limit: "5",
  });
  const r = await fetchWithRetry(`https://api.gbif.org/v1/occurrence/search?${params}`);
  if (!r) return null;
  const d = await r.json();
  for (const occ of d.results || []) {
    for (const m of occ.media || []) {
      if (m.type === "StillImage" && m.identifier) return m.identifier;
    }
  }
  return null;
}

async function main() {
  const plants = await prisma.plant.findMany({
    where: {
      taxonomy: { contains: '"specialty"' },
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true, scientificName: true },
  });
  console.log(`🖼️ ${plants.length} plantes à spécialité sans image`);

  let fixed = 0;
  for (const plant of plants) {
    const image = await getImage(plant.scientificName);
    if (image) {
      await prisma.plant.update({ where: { id: plant.id }, data: { imageUrl: image } });
      console.log(`  ✅ ${plant.scientificName}`);
      fixed++;
    } else {
      console.log(`  ⚠️ ${plant.scientificName} — aucune image GBIF`);
    }
    await new Promise((r) => setTimeout(r, 2500)); // délai anti-rate-limit
  }
  console.log(`\n✅ ${fixed}/${plants.length} images récupérées`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
