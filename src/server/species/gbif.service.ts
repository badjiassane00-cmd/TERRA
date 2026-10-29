const GBIF_API = "https://api.gbif.org/v1";
const REVALIDATE_SECONDS = 6 * 60 * 60;

const KINGDOMS: Record<string, string> = {
  animalia: "Animalia",
  plantae: "Plantae",
  fungi: "Fungi",
  chromista: "Chromista",
  protozoa: "Protozoa",
  bacteria: "Bacteria",
  archaea: "Archaea",
  viruses: "Viruses",
};

const ACCEPTED_IMAGE_LICENSES = ["CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0"] as const;
const FEATURED_TAXON_KEYS = [5406695, 5360150, 3874097, 5219404, 2435350, 2953137];
const LICENSE_URLS: Record<(typeof ACCEPTED_IMAGE_LICENSES)[number], string> = {
  "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC-BY-SA-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

type GbifUsage = {
  key: number;
  nubKey?: number;
  acceptedKey?: number;
  scientificName?: string;
  canonicalName?: string;
  authorship?: string;
  rank?: string;
  status?: string;
  taxonomicStatus?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  datasetKey?: string;
  habitat?: string;
  threatStatus?: string;
  accordingTo?: string;
  numDescendants?: number;
  extinct?: boolean;
};

type GbifPage<T> = { results?: T[]; count?: number; endOfRecords?: boolean; offset?: number; limit?: number };
type GbifMedia = { type?: string; identifier?: string; license?: string; creator?: string; publisher?: string; rightsHolder?: string; title?: string; description?: string; references?: string; source?: string };
type GbifOccurrence = { media?: GbifMedia[] };

export class GbifApiError extends Error {
  constructor(public readonly status: number) {
    super(`GBIF API error ${status}`);
    this.name = "GbifApiError";
  }
}

async function gbifJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GBIF_API}${path}`, {
    headers: { Accept: "application/json", "Accept-Language": "fr" },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new GbifApiError(response.status);
  return response.json() as Promise<T>;
}

function encodeParams(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}

async function kingdomKey(kingdomName: string) {
  const result = await gbifJson<{ key?: number }>(`/species/match?${encodeParams({ name: kingdomName, rank: "KINGDOM", strict: "true" })}`);
  return result.key;
}

function unwrapList<T>(value: T[] | GbifPage<T> | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value && Array.isArray(value.results) ? value.results : [];
}

function normalizedLicense(value?: string | null): (typeof ACCEPTED_IMAGE_LICENSES)[number] | null {
  if (!value) return null;
  const source = value.trim().toLowerCase().replace(/^http:\/\//, "https://").replace(/\/$/, "");
  const matched = source === "cc0-1.0" || source.includes("creativecommons.org/publicdomain/zero/1.0") ? "CC0-1.0"
    : source === "cc-by-4.0" || source.includes("creativecommons.org/licenses/by/4.0") ? "CC-BY-4.0"
    : source === "cc-by-sa-4.0" || source.includes("creativecommons.org/licenses/by-sa/4.0") ? "CC-BY-SA-4.0"
    : null;
  return matched && ACCEPTED_IMAGE_LICENSES.includes(matched) ? matched : null;
}

function normalizeImage(media: GbifMedia) {
  const license = normalizedLicense(media.license);
  if (!license || media.type !== "StillImage" || !media.identifier || !media.identifier.startsWith("https://")) return null;
  return {
    url: media.identifier,
    title: media.title || null,
    creator: media.creator || media.rightsHolder || null,
    publisher: media.publisher || null,
    license,
    licenseUrl: LICENSE_URLS[license],
    sourceUrl: media.references?.startsWith("https://") ? media.references : media.source?.startsWith("https://") ? media.source : null,
  };
}

async function occurrenceImages(taxonKey: number, limit = 8) {
  const params = new URLSearchParams({ taxonKey: String(taxonKey), mediaType: "StillImage", limit: "100" });
  params.append("license", "CC0_1_0");
  params.append("license", "CC_BY_4_0");
  const page = await gbifJson<GbifPage<GbifOccurrence>>(`/occurrence/search?${params.toString()}`);
  const unique = new Map<string, NonNullable<ReturnType<typeof normalizeImage>>>();
  for (const record of unwrapList(page)) {
    for (const media of record.media || []) {
      const image = normalizeImage(media);
      if (image && !unique.has(image.url)) unique.set(image.url, image);
    }
    if (unique.size >= limit) break;
  }
  return [...unique.values()].slice(0, limit);
}

const FEATURED_IMAGE_FALLBACKS: Record<number, NonNullable<ReturnType<typeof normalizeImage>>> = {
  5406695: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/605619791/original.jpg", title: null, creator: "biogeek", publisher: "iNaturalist", license: "CC-BY-4.0", licenseUrl: LICENSE_URLS["CC-BY-4.0"], sourceUrl: "https://www.inaturalist.org/photos/605619791" },
  5360150: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/651283033/original.jpg", title: null, creator: "dune_ninja", publisher: "iNaturalist", license: "CC0-1.0", licenseUrl: LICENSE_URLS["CC0-1.0"], sourceUrl: "https://www.inaturalist.org/photos/651283033" },
  3874097: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/472816345/original.jpeg", title: null, creator: "Raúl A. Ruiz M.", publisher: "iNaturalist", license: "CC-BY-4.0", licenseUrl: LICENSE_URLS["CC-BY-4.0"], sourceUrl: "https://www.inaturalist.org/photos/472816345" },
  5219404: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/610686710/original.jpg", title: null, creator: "Eric Watts", publisher: "iNaturalist", license: "CC-BY-4.0", licenseUrl: LICENSE_URLS["CC-BY-4.0"], sourceUrl: "https://www.inaturalist.org/photos/610686710" },
  2435350: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/608231276/original.jpg", title: null, creator: "Diego Rubolini", publisher: "iNaturalist", license: "CC-BY-4.0", licenseUrl: LICENSE_URLS["CC-BY-4.0"], sourceUrl: "https://www.inaturalist.org/photos/608231276" },
  2953137: { url: "https://inaturalist-open-data.s3.amazonaws.com/photos/613028613/original.jpg", title: null, creator: "Attila Oláh", publisher: "iNaturalist", license: "CC-BY-4.0", licenseUrl: LICENSE_URLS["CC-BY-4.0"], sourceUrl: "https://www.inaturalist.org/photos/613028613" },
};

export type SpeciesSearchFilters = {
  query: string;
  kingdom?: string;
  rank?: string;
  habitat?: string;
  threatStatus?: string;
  offset: number;
  limit: number;
};

export const gbifSpeciesService = {
  async featured() {
    const entries = await Promise.all(FEATURED_TAXON_KEYS.map(async (key) => {
      try {
        const taxon = await gbifJson<GbifUsage>(`/species/${key}`);
        const images = await occurrenceImages(taxon.nubKey || taxon.key, 1).catch(() => []);
        const image = images[0] || FEATURED_IMAGE_FALLBACKS[key];
        if (!image) return null;
        return {
          key: taxon.nubKey || taxon.key,
          scientificName: taxon.scientificName || taxon.canonicalName || "Nom non renseigné",
          canonicalName: taxon.canonicalName || taxon.scientificName || "Nom non renseigné",
          authorship: taxon.authorship || null,
          rank: taxon.rank || null,
          kingdom: taxon.kingdom || null,
          phylum: taxon.phylum || null,
          class: taxon.class || null,
          order: taxon.order || null,
          family: taxon.family || null,
          genus: taxon.genus || null,
          taxonomicStatus: taxon.taxonomicStatus || taxon.status || null,
          sourceUrl: `https://www.gbif.org/species/${taxon.nubKey || taxon.key}`,
          image,
        };
      } catch {
        const image = FEATURED_IMAGE_FALLBACKS[key];
        const fallbackNames: Record<number, string> = {
          5406695: "Adansonia digitata", 5360150: "Faidherbia albida", 3874097: "Rhizophora racemosa",
          5219404: "Panthera leo", 2435350: "Loxodonta africana", 2953137: "Piliostigma reticulatum",
        };
        return image ? { key, scientificName: fallbackNames[key], canonicalName: fallbackNames[key], authorship: null, rank: "SPECIES", kingdom: null, phylum: null, class: null, order: null, family: null, genus: null, taxonomicStatus: "ACCEPTED", sourceUrl: `https://www.gbif.org/species/${key}`, image } : null;
      }
    }));
    return entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  },

  async search(filters: SpeciesSearchFilters) {
    const selectedKingdom = filters.kingdom ? KINGDOMS[filters.kingdom.toLowerCase()] : undefined;
    const higherKey = selectedKingdom ? await kingdomKey(selectedKingdom) : undefined;
    if (filters.kingdom && !higherKey) return { results: [], count: 0, offset: filters.offset, limit: filters.limit, endOfRecords: true };
    const query = encodeParams({
      q: filters.query,
      status: "ACCEPTED",
      rank: filters.rank,
      habitat: filters.habitat,
      threatStatus: filters.threatStatus,
      highertaxonKey: higherKey,
      offset: filters.offset,
      limit: filters.limit,
    });
    const page = await gbifJson<GbifPage<GbifUsage>>(`/species/search?${query}`);
    const results = unwrapList(page).filter((item) => item.key && item.scientificName).map((item) => ({
      key: item.nubKey || item.key,
      scientificName: item.scientificName || item.canonicalName || "Nom non renseigné",
      canonicalName: item.canonicalName || item.scientificName || "Nom non renseigné",
      authorship: item.authorship || null,
      rank: item.rank || null,
      kingdom: item.kingdom || null,
      phylum: item.phylum || null,
      class: item.class || null,
      order: item.order || null,
      family: item.family || null,
      genus: item.genus || null,
      taxonomicStatus: item.taxonomicStatus || item.status || null,
      sourceUrl: `https://www.gbif.org/species/${item.nubKey || item.key}`,
    }));
    return { results, count: page.count || results.length, offset: page.offset ?? filters.offset, limit: page.limit ?? filters.limit, endOfRecords: page.endOfRecords ?? true };
  },

  async get(key: number) {
    const requested = await gbifJson<GbifUsage>(`/species/${key}`);
    const acceptedKey = requested.acceptedKey && requested.acceptedKey !== requested.key ? requested.acceptedKey : requested.nubKey && requested.nubKey !== requested.key ? requested.nubKey : requested.key;
    const taxon = acceptedKey === requested.key ? requested : await gbifJson<GbifUsage>(`/species/${acceptedKey}`);
    const canonicalKey = taxon.nubKey || taxon.key;

    const [namesRaw, synonymsRaw, mediaRaw, distributionsRaw, referencesRaw, conservationRaw] = await Promise.all([
      gbifJson<unknown>(`/species/${canonicalKey}/vernacularNames?limit=300`).catch(() => []),
      gbifJson<unknown>(`/species/${canonicalKey}/synonyms?limit=100`).catch(() => []),
      gbifJson<unknown>(`/species/${canonicalKey}/media?limit=100`).catch(() => []),
      gbifJson<unknown>(`/species/${canonicalKey}/distributions?limit=300`).catch(() => []),
      gbifJson<unknown>(`/species/${canonicalKey}/references?limit=100`).catch(() => []),
      gbifJson<string | { category?: string; source?: string; sourceTaxonKey?: number; status?: string }>(`/species/${canonicalKey}/iucnRedListCategory`).catch(() => null),
    ]);
    const names = unwrapList(namesRaw as GbifPage<{ vernacularName?: string; language?: string; country?: string; preferred?: boolean; source?: string }> | Array<{ vernacularName?: string; language?: string; country?: string; preferred?: boolean; source?: string }>)
      .filter((entry) => entry.vernacularName)
      .map((entry) => ({ name: entry.vernacularName!, language: entry.language || null, country: entry.country || null, preferred: Boolean(entry.preferred), source: entry.source || null }));
    const synonyms = unwrapList(synonymsRaw as GbifPage<GbifUsage> | GbifUsage[])
      .filter((entry) => entry.scientificName)
      .map((entry) => ({ key: entry.key, scientificName: entry.scientificName!, authorship: entry.authorship || null, rank: entry.rank || null, sourceUrl: `https://www.gbif.org/species/${entry.key}` }));
    let images = unwrapList(mediaRaw as GbifPage<GbifMedia> | GbifMedia[]).map(normalizeImage).filter((entry): entry is NonNullable<ReturnType<typeof normalizeImage>> => Boolean(entry));
    if (!images.length) images = await occurrenceImages(canonicalKey, 8).catch(() => []);
    const distributions = unwrapList(distributionsRaw as GbifPage<{ locationId?: string; locality?: string; country?: string; establishmentMeans?: string; threatStatus?: string; source?: string }> | Array<{ locationId?: string; locality?: string; country?: string; establishmentMeans?: string; threatStatus?: string; source?: string }>)
      .map((entry) => ({ country: entry.country || null, locality: entry.locality || entry.locationId || null, establishmentMeans: entry.establishmentMeans || null, threatStatus: entry.threatStatus || null, source: entry.source || null }))
      .filter((entry) => entry.country || entry.locality);
    const references = unwrapList(referencesRaw as GbifPage<{ citation?: string; identifier?: string; title?: string; author?: string; year?: string; type?: string }> | Array<{ citation?: string; identifier?: string; title?: string; author?: string; year?: string; type?: string }>)
      .map((entry) => ({ title: entry.title || entry.citation || "Référence GBIF", author: entry.author || null, year: entry.year || null, url: entry.identifier?.startsWith("https://") ? entry.identifier : null, type: entry.type || null }))
      .filter((entry) => entry.url || entry.title);

    const localizedNames = names.filter((entry) => ["fr", "fra", "fre", "French"].includes(entry.language || "")).sort((left, right) => Number(right.preferred) - Number(left.preferred));
    const commonNames = [...localizedNames, ...names.filter((entry) => !localizedNames.includes(entry))];
    const iucnCategory = (typeof conservationRaw === "string" ? conservationRaw : conservationRaw?.category || conservationRaw?.status) || taxon.threatStatus || null;

    return {
      key: canonicalKey,
      requestedKey: key,
      redirectedFromSynonym: requested.taxonomicStatus === "SYNONYM" || Boolean(requested.acceptedKey && requested.acceptedKey !== requested.key),
      scientificName: taxon.scientificName || taxon.canonicalName || "Nom non renseigné",
      canonicalName: taxon.canonicalName || taxon.scientificName || "Nom non renseigné",
      authorship: taxon.authorship || null,
      rank: taxon.rank || null,
      taxonomicStatus: taxon.taxonomicStatus || taxon.status || null,
      classification: { kingdom: taxon.kingdom || null, phylum: taxon.phylum || null, class: taxon.class || null, order: taxon.order || null, family: taxon.family || null, genus: taxon.genus || null, species: taxon.species || null },
      habitat: taxon.habitat || null,
      extinct: taxon.extinct ?? null,
      descendantCount: taxon.numDescendants ?? null,
      commonNames,
      synonyms,
      images,
      distributions,
      conservation: iucnCategory ? { category: iucnCategory, sourceUrl: `https://www.iucnredlist.org/search?query=${encodeURIComponent(taxon.scientificName || taxon.canonicalName || "")}` } : null,
      sources: [
        { title: "Fiche taxonomique GBIF", url: `https://www.gbif.org/species/${canonicalKey}`, type: "Taxonomie" },
        ...(taxon.datasetKey ? [{ title: taxon.accordingTo || "Checklist source", url: `https://www.gbif.org/dataset/${taxon.datasetKey}`, type: "Checklist contributrice" }] : []),
        { title: "API GBIF — nomenclature et noms communs", url: `https://api.gbif.org/v1/species/${canonicalKey}`, type: "Données taxonomiques" },
        { title: "GBIF — occurrences documentées", url: `https://www.gbif.org/occurrence/search?taxon_key=${canonicalKey}`, type: "Occurrences" },
        ...(conservationRaw ? [{ title: "UICN — recherche de statut", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(taxon.scientificName || taxon.canonicalName || "")}`, type: "Conservation" }] : []),
      ],
      references,
      syncedAt: new Date().toISOString(),
    };
  },
};
