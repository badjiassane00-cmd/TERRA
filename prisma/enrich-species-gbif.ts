/**
 * Enrichit la base avec des milliers d'espèces réelles depuis GBIF.
 * Usage: npx tsx prisma/enrich-species-gbif.ts [nombreMaxParFamille]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FAMILIES = [
  "Malvaceae", "Bignoniaceae", "Fabaceae", "Anacardiaceae", "Moraceae",
  "Combretaceae", "Apocynaceae", "Rubiaceae", "Euphorbiaceae", "Sapindaceae",
  "Meliaceae", "Annonaceae", "Lamiaceae", "Solanaceae", "Arecaceae",
  "Poaceae", "Asteraceae", "Ebenaceae", "Capparaceae", "Passifloraceae",
  "Cucurbitaceae", "Amaranthaceae", "Celastraceae", "Rutaceae", "Myrtaceae",
  "Oleaceae", "Magnoliaceae", "Fagaceae", "Betulaceae", "Pinaceae",
  "Cupressaceae", "Salicaceae", "Rosaceae", "Ericaceae", "Proteaceae",
];

const GBIF_BASE = "https://api.gbif.org/v1/species/search";
const BACKBONE = "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c"; // GBIF Backbone Taxonomy

interface GbifSpecies {
  scientificName: string;
  vernacularNames?: Array<{ vernacularName: string; lang?: string }>;
  family?: string;
  genus?: string;
  species?: string;
  kingdom?: string;
  nubKey?: number;
}

async function fetchFamily(family: string, limit: number): Promise<GbifSpecies[]> {
  // GBIF exige un paramètre q non vide pour appliquer les filtres facettes
  const params = new URLSearchParams({
    q: family,
    rank: "SPECIES",
    status: "ACCEPTED",
    datasetKey: BACKBONE,
    limit: String(Math.min(limit, 1000)),
  });
  const response = await fetch(`${GBIF_BASE}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "SunuNature/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return [];
  const data = await response.json();
  // Le q est du plein-texte : on garde uniquement les vraies espèces de la famille visée
  return ((data.results || []) as GbifSpecies[]).filter(
    (sp) => sp.kingdom === "Plantae" && sp.family === family && sp.species
  );
}

async function main() {
  const maxPerFamily = parseInt(process.argv[2] || "150", 10);
  console.log(`🌱 Enrichissement GBIF — ${FAMILIES.length} familles × ${maxPerFamily} espèces max`);

  let created = 0;
  let skipped = 0;

  for (const family of FAMILIES) {
    try {
      const speciesList = await fetchFamily(family, maxPerFamily);
      console.log(`  📚 ${family}: ${speciesList.length} espèces valides`);

      for (const sp of speciesList) {
        if (!sp.scientificName) continue;

        const commonNames = (sp.vernacularNames || [])
          .filter((v) => v.lang === "fra" || v.lang === "fre")
          .map((v) => v.vernacularName)
          .slice(0, 5);

        try {
          await prisma.plant.upsert({
            where: { scientificName: sp.scientificName },
            update: {
              family: sp.family || family,
              genus: sp.genus || null,
              species: sp.species || null,
              gbifId: sp.nubKey ? String(sp.nubKey) : null,
            },
            create: {
              scientificName: sp.scientificName,
              family: sp.family || family,
              genus: sp.genus || null,
              species: sp.species || null,
              gbifId: sp.nubKey ? String(sp.nubKey) : null,
              commonNames: JSON.stringify(
                commonNames.length > 0 ? commonNames : [sp.scientificName.split(" ")[0]]
              ),
            },
          });
          created++;
        } catch {
          skipped++;
        }
      }

      // Délai pour respecter GBIF
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ⚠️ ${family} échoué:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n✅ Terminé : ${created} espèces créées/mises à jour, ${skipped} ignorées`);
  const total = await prisma.plant.count();
  console.log(`📊 Total plantes en base : ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
