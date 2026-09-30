export type DiseaseFinding = {
  disease: string;
  confidence: number;
  description: string;
  treatment: string[];
};

export type Identification = {
  id: string;
  scientific_name: string;
  common_names: string[];
  probability: number;
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  description?: string;
  imageUrl?: string;
  similar_images?: Array<{ url: string; similarity: number }>;
  disease_detection?: DiseaseFinding[];
  sources: { provider: string; gbif?: string; inaturalist?: string };
};

interface PlantNetResult {
  results?: Array<{
    score?: number;
    species?: {
      scientificNameWithoutAuthor?: string;
      commonNames?: string[];
      family?: { scientificNameWithoutAuthor?: string };
      genus?: { scientificNameWithoutAuthor?: string };
      images?: Array<{
        url?: { m?: string; o?: string; s?: string };
      }>;
    };
  }>;
}

interface DiseaseCandidate {
  name?: string;
  disease?: { name?: string; description?: string; treatment?: string | string[] };
  score?: number;
  probability?: number;
  confidence?: number;
  description?: string;
  treatment?: string | string[];
}

interface DiseaseResult {
  results?: DiseaseCandidate[];
  result?: { disease?: { suggestions?: DiseaseCandidate[] } };
  suggestions?: DiseaseCandidate[];
}

const GBIF = "https://api.gbif.org/v1";

async function json(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TERRA/1.0" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Source botanique indisponible (${response.status})`);
  return response.json();
}

/** Enriches an AI prediction with the open GBIF taxonomic backbone. */
export async function enrichWithGbif(result: Identification): Promise<Identification> {
  try {
    const match = await json(`${GBIF}/species/match?name=${encodeURIComponent(result.scientific_name)}&rank=species`);
    const usageKey = match.usageKey ?? match.key;
    if (!usageKey) return result;
    const [taxon, vernacular] = await Promise.all([
      json(`${GBIF}/species/${usageKey}`),
      json(`${GBIF}/species/${usageKey}/vernacularNames`).catch(() => []),
    ]);
    const names = Array.from(new Set([
      ...result.common_names,
      ...(Array.isArray(vernacular) ? vernacular : []).filter((entry: { language?: string }) =>
        !entry.language || ["fra", "fr", "eng", "en"].includes(entry.language.toLowerCase()),
      ).map((entry: { vernacularName?: string }) => entry.vernacularName).filter(Boolean),
    ])).slice(0, 8) as string[];
    return {
      ...result,
      scientific_name: taxon.canonicalName || result.scientific_name,
      common_names: names,
      taxonomy: {
        kingdom: taxon.kingdom || result.taxonomy?.kingdom,
        phylum: taxon.phylum || result.taxonomy?.phylum,
        class: taxon.class || result.taxonomy?.class,
        order: taxon.order || result.taxonomy?.order,
        family: taxon.family || result.taxonomy?.family,
        genus: taxon.genus || result.taxonomy?.genus,
        species: taxon.species || taxon.canonicalName || result.taxonomy?.species,
      },
      sources: { ...result.sources, gbif: `https://www.gbif.org/species/${usageKey}` },
    };
  } catch {
    return result;
  }
}

export function normalizePlantNet(data: PlantNetResult): Identification {
  const best = data.results?.[0];
  if (!best?.species?.scientificNameWithoutAuthor) throw new Error("Aucune espèce n'a été reconnue.");
  const scientificName = best.species.scientificNameWithoutAuthor;
  const rawImages = best.species.images || [];
  const similarImages = rawImages
    .map((image: { url?: { m?: string; o?: string; s?: string } }) => ({
      url: image.url?.m || image.url?.o || image.url?.s,
      similarity: Number(best.score || 0),
    }))
    .filter((image): image is { url: string; similarity: number } => !!image.url);
  return {
    id: scientificName,
    scientific_name: scientificName,
    common_names: best.species.commonNames || [],
    probability: Number(best.score || 0),
    taxonomy: { family: best.species.family?.scientificNameWithoutAuthor, genus: best.species.genus?.scientificNameWithoutAuthor, species: scientificName },
    similar_images: similarImages,
    sources: { provider: "Pl@ntNet" },
  };
}

export function normalizeDiseases(data: DiseaseResult): DiseaseFinding[] {
  const candidates = data.results || data.result?.disease?.suggestions || data.suggestions || [];
  return candidates.slice(0, 3).map((item) => ({
    disease: item.name || item.disease?.name || item.disease || "Anomalie non précisée",
    confidence: Number(item.score ?? item.probability ?? item.confidence ?? 0),
    description: item.description || item.disease?.description || "Diagnostic fourni par le service d'analyse.",
    treatment: Array.isArray(item.treatment) ? item.treatment : item.treatment ? [item.treatment] : ["Isolez la plante et demandez confirmation à un spécialiste avant tout traitement."],
  })).filter((item): item is DiseaseFinding => typeof item.disease === "string");
}
