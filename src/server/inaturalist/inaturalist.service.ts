import type { OrganismGroup } from "@/types/nature";

const API_ROOT = "https://api.inaturalist.org/v1";
const TAXON_BY_GROUP: Partial<Record<OrganismGroup, string>> = {
  PLANT: "Plantae",
  INSECT: "Insecta",
  BIRD: "Aves",
  MAMMAL: "Mammalia",
  REPTILE: "Reptilia",
  AMPHIBIAN: "Amphibia",
  FUNGUS: "Fungi",
};

interface INaturalistPhoto {
  url?: string;
  attribution?: string;
  license_code?: string | null;
}
interface INaturalistTaxon {
  name?: string;
  preferred_common_name?: string;
  iconic_taxon_name?: string;
}
interface INaturalistUser {
  login?: string;
  name?: string;
}
interface INaturalistRawObservation {
  id: number;
  uri?: string;
  observed_on?: string | null;
  created_at?: string;
  place_guess?: string | null;
  location?: string | null;
  quality_grade?: string;
  description?: string | null;
  comments_count?: number;
  taxon?: INaturalistTaxon | null;
  user?: INaturalistUser | null;
  photos?: INaturalistPhoto[];
  observation_photos?: Array<{ photo?: INaturalistPhoto }>;
  identifications?: Array<{ id: number; body?: string; created_at?: string; user?: INaturalistUser; taxon?: INaturalistTaxon }>;
}

function locationOf(observation: INaturalistRawObservation) {
  const [latitude, longitude] = observation.location?.split(",").map(Number) ?? [];
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : { latitude: null, longitude: null };
}

function photosOf(observation: INaturalistRawObservation) {
  const photo = observation.photos?.[0] ?? observation.observation_photos?.[0]?.photo;
  const url = photo?.url?.replace(/square\.(jpg|jpeg|png|webp)/i, "medium.$1") ?? "";
  return {
    imageUrl: url,
    attribution: photo?.attribution ?? (observation.user?.login ? `© ${observation.user.login} / iNaturalist` : "© iNaturalist"),
    license: photo?.license_code ?? null,
  };
}

function groupOf(name?: string): OrganismGroup {
  switch (name) {
    case "Plantae": return "PLANT";
    case "Insecta": return "INSECT";
    case "Aves": return "BIRD";
    case "Mammalia": return "MAMMAL";
    case "Reptilia": return "REPTILE";
    case "Amphibia": return "AMPHIBIAN";
    case "Fungi": return "FUNGUS";
    case "Actinopterygii": case "Mollusca": return "AQUATIC";
    default: return "OTHER";
  }
}

function toPublicObservation(observation: INaturalistRawObservation) {
  const photo = photosOf(observation);
  const location = locationOf(observation);
  return {
    id: String(observation.id),
    source: "iNaturalist" as const,
    sourceUrl: observation.uri ?? `https://www.inaturalist.org/observations/${observation.id}`,
    plantName: observation.taxon?.preferred_common_name || observation.taxon?.name || "Identification en attente",
    scientificName: observation.taxon?.name || "",
    organismGroup: groupOf(observation.taxon?.iconic_taxon_name),
    imageUrl: photo.imageUrl,
    photoAttribution: photo.attribution,
    photoLicense: photo.license,
    region: observation.place_guess || "Afrique",
    description: observation.description || "Observation partagée sur iNaturalist.",
    observedAt: observation.observed_on || observation.created_at || null,
    createdAt: observation.created_at || observation.observed_on || new Date().toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
    qualityGrade: observation.quality_grade || "casual",
    comments: observation.comments_count || 0,
    observer: observation.user?.name || observation.user?.login || "Naturaliste iNaturalist",
    identifications: (observation.identifications || []).map((item) => ({
      id: String(item.id),
      taxonName: item.taxon?.preferred_common_name || item.taxon?.name || item.body || "Identification proposée",
      scientificName: item.taxon?.name || "",
      user: { name: item.user?.name || item.user?.login || "Naturaliste" },
      createdAt: item.created_at || observation.created_at || new Date().toISOString(),
    })),
  };
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "TERRA/1.0 (African biodiversity observations)" },
    signal: AbortSignal.timeout(12_000),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`iNaturalist a répondu avec le statut ${response.status}`);
  return response.json() as Promise<T>;
}

export const inaturalistService = {
  async list(options: { page: number; perPage: number; group?: OrganismGroup; query?: string }) {
    const params = new URLSearchParams({
      swlat: "-35", swlng: "-20", nelat: "38", nelng: "52",
      photos: "true", order_by: "observed_on", order: "desc",
      quality_grade: "research,needs_id", page: String(options.page), per_page: String(options.perPage),
    });
    const taxon = options.group ? TAXON_BY_GROUP[options.group] : undefined;
    if (taxon) params.set("taxon_name", taxon);
    if (options.query) params.set("q", options.query.slice(0, 100));
    const data = await apiGet<{ total_results?: number; results?: INaturalistRawObservation[] }>(`/observations?${params}`);
    return {
      total: data.total_results || 0,
      observations: (data.results || []).map(toPublicObservation),
    };
  },

  async findById(id: string) {
    if (!/^\d+$/.test(id)) return null;
    const data = await apiGet<{ results?: INaturalistRawObservation[] }>(`/observations/${id}`);
    const observation = data.results?.[0];
    return observation ? toPublicObservation(observation) : null;
  },
};
