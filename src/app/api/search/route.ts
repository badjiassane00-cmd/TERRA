import { prisma } from "@/lib/prisma";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { gbifSpeciesService } from "@/server/species/gbif.service";
import { enforceRateLimit } from "@/server/http/rate-limit";

async function GETImpl(request: Request) {
  const limited = await enforceRateLimit(request, "global-search", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) || "";
  if (query.length < 2) return NextResponse.json({ users: [], species: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const viewerId = await getSessionUserId();
  const [users, plants, observations, gbif] = await Promise.all([
    viewerId ? prisma.user.findMany({ where: { name: { contains: query }, isDemo: false }, select: { id: true, name: true, institution: true, avatarUrl: true }, take: 8, orderBy: { name: "asc" } }) : [],
    prisma.plant.findMany({ where: { OR: [{ scientificName: { contains: query } }, { commonNames: { contains: query } }] }, select: { id: true, scientificName: true, commonNames: true, imageUrl: true }, take: 8 }),
    viewerId ? prisma.communityPost.findMany({ where: { removed: false, isEphemeral: false, OR: [{ plantName: { contains: query } }, { scientificName: { contains: query } }] }, select: { id: true, plantName: true, scientificName: true, imageUrl: true, organismGroup: true }, take: 8, orderBy: { createdAt: "desc" } }) : [],
    gbifSpeciesService.search({ query, offset: 0, limit: 8 }).catch(() => ({ results: [] as Array<{ key: number; canonicalName: string; scientificName: string }> })),
  ]);
  const uniqueSpecies = new Map<string, { id: string; name: string; scientificName: string; imageUrl: string | null; observationId?: string; href?: string; sourceType: "GBIF" | "TERRA" | "OBSERVATION" }>();
  for (const item of gbif.results) uniqueSpecies.set(item.scientificName.toLocaleLowerCase(), { id: `gbif-${item.key}`, name: item.canonicalName, scientificName: item.scientificName, imageUrl: null, href: `/especes/${item.key}`, sourceType: "GBIF" });
  for (const plant of plants) {
    const key = plant.scientificName.toLocaleLowerCase();
    if (!uniqueSpecies.has(key)) uniqueSpecies.set(key, { id: plant.id, name: commonName(plant.commonNames, plant.scientificName), scientificName: plant.scientificName, imageUrl: null, href: `/biodiversite?q=${encodeURIComponent(plant.scientificName)}`, sourceType: "TERRA" });
  }
  for (const item of observations) {
    const scientificName = item.scientificName || item.plantName;
    const key = `observation:${item.id}`;
    uniqueSpecies.set(key, { id: item.id, name: item.plantName || "Espèce non identifiée", scientificName, imageUrl: item.imageUrl, observationId: item.id, href: `/observations/${item.id}`, sourceType: "OBSERVATION" });
  }
  return NextResponse.json({ users, species: [...uniqueSpecies.values()].slice(0, 12) }, { headers: { "Cache-Control": "private, no-store" } });
}

function commonName(raw: string, fallback: string) {
  try { const names: unknown = JSON.parse(raw || "[]"); return Array.isArray(names) && typeof names[0] === "string" ? names[0] : fallback; }
  catch { return fallback; }
}

export const GET = withApiErrors(GETImpl);
