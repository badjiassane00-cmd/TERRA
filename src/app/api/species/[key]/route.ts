import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { GbifApiError, gbifSpeciesService } from "@/server/species/gbif.service";
import { NextResponse } from "next/server";

async function GETImpl(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const limited = await enforceRateLimit(request, "species-detail", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { key } = await params;
  if (!/^\d{1,12}$/.test(key)) throw new ApiError("Identifiant GBIF invalide.", 400);
  try {
    const species = await gbifSpeciesService.get(Number(key));
    return NextResponse.json({ species, source: "GBIF" }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    if (error instanceof GbifApiError && error.status === 404) throw new ApiError("Taxon introuvable dans le référentiel GBIF.", 404);
    throw new ApiError("Cette fiche d’espèce est indisponible depuis GBIF.", 502);
  }
}

export const GET = withApiErrors(GETImpl);
