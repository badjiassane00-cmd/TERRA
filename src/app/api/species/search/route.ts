import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { gbifSpeciesService } from "@/server/species/gbif.service";
import { NextResponse } from "next/server";

const RANKS = new Set(["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES", "SUBSPECIES"]);
const HABITATS = new Set(["TERRESTRIAL", "FRESHWATER", "MARINE"]);
const THREAT_STATUSES = new Set(["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD"]);

async function GETImpl(request: Request) {
  const limited = await enforceRateLimit(request, "species-search", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 100) || "";
  if (query.length < 2) return NextResponse.json({ results: [], count: 0, offset: 0, limit: 24, endOfRecords: true });

  const requestedRank = params.get("rank")?.toUpperCase() || "";
  const requestedHabitat = params.get("habitat")?.toUpperCase() || "";
  const requestedThreat = params.get("threatStatus")?.toUpperCase() || "";
  const page = Math.max(0, Math.min(1000, Number.parseInt(params.get("page") || "0", 10) || 0));

  try {
    const data = await gbifSpeciesService.search({
      query,
      kingdom: params.get("kingdom") || undefined,
      rank: RANKS.has(requestedRank) ? requestedRank : undefined,
      habitat: HABITATS.has(requestedHabitat) ? requestedHabitat : undefined,
      threatStatus: THREAT_STATUSES.has(requestedThreat) ? requestedThreat : undefined,
      offset: page * 24,
      limit: 24,
    });
    return NextResponse.json({ ...data, source: { name: "GBIF", url: "https://www.gbif.org/" } }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch {
    throw new ApiError("La recherche GBIF est momentanément indisponible. Réessayez dans un instant.", 502);
  }
}

export const GET = withApiErrors(GETImpl);
