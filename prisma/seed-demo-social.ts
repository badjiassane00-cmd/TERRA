import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { OrganismGroup, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = "https://api.inaturalist.org/v1/observations";
const REUSE_LICENSES = new Set(["cc0", "cc-by", "cc-by-sa"]);
const AFRICAN_PLACES = [
  "Senegal", "Sénégal", "Mali", "Burkina Faso", "Ghana", "Benin", "Bénin", "Togo", "Niger", "Guinea", "Guinée", "Gambia", "Gambie", "Nigeria", "Cameroon", "Cameroun", "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "South Africa", "Afrique du Sud", "Madagascar", "Namibia", "Namibie", "Botswana", "Zambia", "Zambie", "Zimbabwe", "Mozambique", "Côte d’Ivoire", "Cote d'Ivoire", "Morocco", "Maroc", "Egypt", "Égypte", "Democratic Republic of the Congo", "Congo", "Angola", "Malawi", "Eswatini", "Lesotho",
];
const DEMO_PROFILES = [
  { email: "awa.diop@demo.sununature.invalid", name: "Awa Diop", institution: "Compte de démonstration · Botanique", bio: "Galerie démo — plantes et arbres observés en Afrique." },
  { email: "fatou.bah@demo.sununature.invalid", name: "Fatou Bah", institution: "Compte de démonstration · Entomologie", bio: "Galerie démo — insectes et pollinisateurs." },
  { email: "lamine.sow@demo.sununature.invalid", name: "Lamine Sow", institution: "Compte de démonstration · Faune", bio: "Galerie démo — animaux, oiseaux et faune africaine." },
  { email: "sunu.nature@demo.sununature.invalid", name: "Équipe TERRA", institution: "Compte de démonstration", bio: "Profil fictif qui présente des observations publiques réutilisables, avec leurs crédits." },
];
const COMMENT_TEXTS = [
  "Quelqu’un connaît son nom dans une langue locale ?",
  "La forme et les couleurs sont magnifiques. Merci pour le partage !",
  "Une belle observation à garder dans le carnet. L’identification est à confirmer.",
  "Est-ce qu’on peut la rencontrer dans d’autres régions du pays ?",
  "J’ajoute cette espèce à ma liste de choses à observer lors d’une prochaine sortie.",
];

type INatPhoto = { url?: string; attribution?: string; license_code?: string | null };
type INatObservation = {
  id: number; uri?: string; observed_on?: string | null; created_at?: string; place_guess?: string | null;
  location?: string | null; description?: string | null; taxon?: { name?: string; preferred_common_name?: string; iconic_taxon_name?: string; rank?: string } | null;
  user?: { login?: string; name?: string } | null; photos?: INatPhoto[];
};

type DemoSpecies = { taxonId: number; group: OrganismGroup; profileIndex: number };
const TAXA: DemoSpecies[] = [
  { taxonId: 47126, group: OrganismGroup.PLANT, profileIndex: 0 }, // Plantae
  { taxonId: 47158, group: OrganismGroup.INSECT, profileIndex: 1 }, // Insecta
  { taxonId: 3, group: OrganismGroup.BIRD, profileIndex: 2 }, // Aves
  { taxonId: 40151, group: OrganismGroup.MAMMAL, profileIndex: 2 }, // Mammalia
  { taxonId: 26036, group: OrganismGroup.REPTILE, profileIndex: 2 }, // Reptilia
  { taxonId: 20978, group: OrganismGroup.AMPHIBIAN, profileIndex: 2 }, // Amphibia
  { taxonId: 47170, group: OrganismGroup.FUNGUS, profileIndex: 0 }, // Fungi
];

function expectedIconic(taxonId: number) {
  return ({ 47126: "Plantae", 47158: "Insecta", 3: "Aves", 40151: "Mammalia", 26036: "Reptilia", 20978: "Amphibia", 47170: "Fungi" } as Record<number, string>)[taxonId];
}

function isAfricanPlace(place: string) {
  const lower = place.toLocaleLowerCase("fr");
  return AFRICAN_PLACES.some((country) => lower.includes(country.toLocaleLowerCase("fr")));
}

async function fetchObservations(taxonId: number): Promise<INatObservation[]> {
  const params = new URLSearchParams({
    swlat: "-35", swlng: "-20", nelat: "38", nelng: "52", taxon_id: String(taxonId),
    rank: "species", photos: "true", quality_grade: "research,needs_id",
    photo_license: "cc0,cc-by,cc-by-sa", order_by: "observed_on", order: "desc", per_page: "100",
  });
  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(`${API}?${params}`, {
        headers: { Accept: "application/json", "User-Agent": "TERRA demo seed (licensed photo attribution)" },
        signal: AbortSignal.timeout(25_000),
      });
      if (response.ok) break;
      if (response.status < 500) throw new Error(`iNaturalist a répondu ${response.status} pour le taxon ${taxonId}.`);
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }
  if (!response?.ok) throw new Error(`Impossible de charger les observations du taxon ${taxonId} depuis iNaturalist.`);
  const payload = await response.json() as { results?: INatObservation[] };
  return (payload.results || []).filter((observation) => {
    const photo = observation.photos?.[0];
    return !!photo?.url && REUSE_LICENSES.has((photo.license_code || "").toLowerCase()) &&
      observation.taxon?.rank === "species" && isAfricanPlace(observation.place_guess || "");
  });
}

async function main() {
  const profiles = await Promise.all(DEMO_PROFILES.map(async (profile) => prisma.user.upsert({
    where: { email: profile.email },
    update: { name: profile.name, institution: profile.institution, bio: profile.bio, isDemo: true },
    create: {
      ...profile, isDemo: true,
      password: await bcrypt.hash(randomBytes(40).toString("hex"), 12),
    },
  })));

  const observations: Array<{ observation: INatObservation; group: OrganismGroup; profileIndex: number }> = [];
  const usedIds = new Set<number>();
  for (const taxon of TAXA) {
    const results = await fetchObservations(taxon.taxonId);
    let added = 0;
    for (const observation of results) {
      if (usedIds.has(observation.id)) continue;
      usedIds.add(observation.id);
      observations.push({ observation, group: taxon.group, profileIndex: taxon.profileIndex });
      added++;
      if (added === 3) break;
    }
  }
  if (observations.length < 9 || !observations.some((item) => item.group === OrganismGroup.PLANT) || !observations.some((item) => item.group === OrganismGroup.INSECT) || !observations.some((item) => new Set<OrganismGroup>([OrganismGroup.BIRD, OrganismGroup.MAMMAL, OrganismGroup.REPTILE, OrganismGroup.AMPHIBIAN]).has(item.group))) {
    throw new Error(`Pas assez d’observations africaines à licence ouverte pour la démo (${observations.length}). Aucun contenu n’a été publié.`);
  }

  await prisma.communityPost.deleteMany({ where: { isDemo: true, sourceUrl: { notIn: observations.map(({ observation }) => observation.uri || `https://www.inaturalist.org/observations/${observation.id}`) } } });
  console.log("Observations sélectionnées :", observations.reduce<Record<string, number>>((counts, item) => { counts[item.group] = (counts[item.group] || 0) + 1; return counts; }, {}));
  let imported = 0;
  for (const [index, item] of observations.entries()) {
    const source = item.observation;
    const photo = source.photos![0];
    const sourceUrl = source.uri || `https://www.inaturalist.org/observations/${source.id}`;
    const attribution = photo.attribution || (source.user?.login ? `© ${source.user.login} / iNaturalist` : "iNaturalist observer");
    const photoUrl = photo.url!.replace(/square\.(jpg|jpeg|png|webp)/i, "large.$1");
    const name = source.taxon?.preferred_common_name || source.taxon?.name || "Identification en attente";
    const scientificName = source.taxon?.name || name;
    const coords = source.location?.split(",").map(Number) || [];
    const originalObserver = source.user?.name || source.user?.login || "observateur iNaturalist";
    const sourceDescription = `Observation réelle publiée par ${originalObserver} sur iNaturalist. Profil de démonstration TERRA : cette publication relaie la fiche source et ne prétend pas que le compte fictif a observé l’espèce.`;
    const post = await prisma.communityPost.upsert({
      where: { sourceUrl },
      update: {
        userId: profiles[item.profileIndex].id, plantName: name, scientificName,
        imageUrl: photoUrl, thumbnailUrl: photo.url!.replace(/square\.(jpg|jpeg|png|webp)/i, "medium.$1"),
        region: source.place_guess || "Afrique", description: sourceDescription, organismGroup: item.group,
        observedAt: source.observed_on ? new Date(source.observed_on) : null,
        latitude: Number.isFinite(coords[0]) ? coords[0] : null, longitude: Number.isFinite(coords[1]) ? coords[1] : null,
        locationVisibility: "APPROXIMATE", sourceObserver: originalObserver, photoAttribution: attribution,
        photoLicense: photo.license_code, isDemo: true, removed: false,
      },
      create: {
        userId: profiles[item.profileIndex].id, plantName: name, scientificName,
        imageUrl: photoUrl, thumbnailUrl: photo.url!.replace(/square\.(jpg|jpeg|png|webp)/i, "medium.$1"),
        region: source.place_guess || "Afrique", description: sourceDescription, organismGroup: item.group,
        observedAt: source.observed_on ? new Date(source.observed_on) : null,
        latitude: Number.isFinite(coords[0]) ? coords[0] : null, longitude: Number.isFinite(coords[1]) ? coords[1] : null,
        locationVisibility: "APPROXIMATE", sourceUrl, sourceObserver: originalObserver,
        photoAttribution: attribution, photoLicense: photo.license_code, isDemo: true,
      },
    });

    for (const commentIndex of [0, 1]) {
      const commenter = profiles[(item.profileIndex + commentIndex + 1) % profiles.length];
      const body = COMMENT_TEXTS[(index + commentIndex) % COMMENT_TEXTS.length];
      const exists = await prisma.communityComment.findFirst({ where: { postId: post.id, userId: commenter.id, body } });
      if (!exists) await prisma.communityComment.create({ data: { postId: post.id, userId: commenter.id, body, isDemo: true } });
    }
    const commentCount = await prisma.communityComment.count({ where: { postId: post.id } });
    await prisma.communityPost.update({ where: { id: post.id }, data: { comments: commentCount } });
    imported++;
  }
  console.log(`Importées : ${imported} observations sous licence ouverte, ${profiles.length} profils fictifs, commentaires démo.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
