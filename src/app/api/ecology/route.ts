import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";
import { distanceKm } from "@/lib/geo";

type EcologyPost = Awaited<ReturnType<typeof communityRepository.findForEcology>>[number];
type MonthSummary = { month: number; count: number; species: Set<string>; groups: Set<string>; groupCounts: Record<string, number> };
type EcologyFilters = { region?: string; hasCoordinates: boolean; latitude: number; longitude: number; radiusKm: number };

function parseEcologyFilters(searchParams: URLSearchParams): { filters: EcologyFilters } | { error: string } {
  const region = searchParams.get("region")?.trim().slice(0, 80);
  const rawLatitude = searchParams.get("lat");
  const rawLongitude = searchParams.get("lng");
  const hasCoordinates = searchParams.has("lat") || searchParams.has("lng");
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  const radiusKm = Number(searchParams.get("radius") || 30);

  if (hasCoordinates && (!rawLatitude?.trim() || !rawLongitude?.trim() || !Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180)) {
    return { error: "Position invalide." };
  }
  if (hasCoordinates && (!Number.isFinite(radiusKm) || radiusKm < 5 || radiusKm > 100)) {
    return { error: "Le rayon doit être compris entre 5 et 100 km." };
  }
  return { filters: { region: region || undefined, hasCoordinates, latitude, longitude, radiusKm } };
}

function filterPostsByRadius(posts: EcologyPost[], filters: EcologyFilters) {
  if (!filters.hasCoordinates) return posts;
  return posts.filter((post) => post.latitude !== null && post.longitude !== null
    && distanceKm(filters.latitude, filters.longitude, post.latitude, post.longitude) <= filters.radiusKm);
}

function summarizeMonths(posts: EcologyPost[]): MonthSummary[] {
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: 0, species: new Set<string>(), groups: new Set<string>(), groupCounts: {} as Record<string, number> }));
  for (const post of posts) {
    if (!post.observedAt) continue;
    const bucket = months[post.observedAt.getMonth()];
    bucket.count += 1;
    bucket.species.add(post.scientificName || post.plantName);
    bucket.groups.add(post.organismGroup);
    bucket.groupCounts[post.organismGroup] = (bucket.groupCounts[post.organismGroup] || 0) + 1;
  }
  return months;
}

function buildCoPresenceRelations(posts: EcologyPost[]) {
  const bins = new Map<string, { plants: Set<string>; insects: Set<string> }>();
  for (const post of posts) {
    if (!post.observedAt || post.latitude === null || post.longitude === null) continue;
    const cell = `${Math.round(post.latitude / 0.045)}:${Math.round(post.longitude / 0.045)}`;
    const key = `${cell}:${post.observedAt.getFullYear()}-${post.observedAt.getMonth()}`;
    const bin = bins.get(key) || { plants: new Set<string>(), insects: new Set<string>() };
    if (post.organismGroup === "PLANT") bin.plants.add(post.scientificName || post.plantName);
    if (post.organismGroup === "INSECT") bin.insects.add(post.scientificName || post.plantName);
    bins.set(key, bin);
  }

  const relations = new Map<string, { plant: string; insect: string; occurrences: number }>();
  for (const bin of bins.values()) {
    for (const plant of bin.plants) for (const insect of bin.insects) {
      const key = `${plant}\u0000${insect}`;
      const relation = relations.get(key) || { plant, insect, occurrences: 0 };
      relation.occurrences += 1;
      relations.set(key, relation);
    }
  }
  return [...relations.values()].filter((relation) => relation.occurrences >= 2)
    .sort((left, right) => right.occurrences - left.occurrences).slice(0, 12);
}

/** Phenology and co-presence signals derived only from public community observations. */
async function GETImpl(request: Request) {
  const parsed = parseEcologyFilters(new URL(request.url).searchParams);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);
    const posts = filterPostsByRadius(await communityRepository.findForEcology(since, parsed.filters.region), parsed.filters);
    const months = summarizeMonths(posts);
    const currentMonth = new Date().getMonth() + 1;
    const current = months[currentMonth - 1];
    const next = months[currentMonth % 12];
    return NextResponse.json({
      calendar: months.map((month) => ({ month: month.month, count: month.count, speciesCount: month.species.size, groups: [...month.groups] })),
      currentMonth: { month: currentMonth, count: current.count, species: [...current.species].slice(0, 8), speciesCount: current.species.size, groupCounts: current.groupCounts },
      nextMonth: { month: (currentMonth % 12) + 1, count: next.count, species: [...next.species].slice(0, 8) },
      relations: buildCoPresenceRelations(posts),
      region: parsed.filters.region || (parsed.filters.hasCoordinates ? `Rayon de ${parsed.filters.radiusKm} km` : "Monde"),
      radiusKm: parsed.filters.hasCoordinates ? parsed.filters.radiusKm : null,
      sourceCount: posts.length,
    });
  } catch (error) {
    console.error("Erreur calendrier écologique:", error);
    return NextResponse.json({ error: "Les observations écologiques sont indisponibles." }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
