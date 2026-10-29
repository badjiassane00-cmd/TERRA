import { NextResponse } from "next/server";
import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { gbifSpeciesService } from "@/server/species/gbif.service";

async function GETImpl(request: Request) {
  const limited = await enforceRateLimit(request, "species-featured", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const rawOffset = new URL(request.url).searchParams.get("offset") || "0";
  const parsedOffset = Number.parseInt(rawOffset, 10);
  if (!Number.isSafeInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 100_000) {
    throw new ApiError("La page demandée est invalide.", 400);
  }

  try {
    const data = await gbifSpeciesService.featured(parsedOffset, 24);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=21600" },
    });
  } catch {
    throw new ApiError("La sélection d’espèces est momentanément indisponible. Réessayez dans un instant.", 502);
  }
}

export const GET = withApiErrors(GETImpl);
