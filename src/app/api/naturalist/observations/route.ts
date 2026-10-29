import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { ORGANISM_GROUPS, type OrganismGroup } from "@/types/nature";
import { inaturalistService } from "@/server/inaturalist/inaturalist.service";
import { enforceRateLimit } from "@/server/http/rate-limit";
async function GETImpl(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedGroup = params.get("group");
  const group = requestedGroup && ORGANISM_GROUPS.includes(requestedGroup as OrganismGroup)
    ? requestedGroup as OrganismGroup
    : undefined;
  const page = Math.min(Math.max(Number(params.get("page") || 1), 1), 100);
  const perPage = Math.min(Math.max(Number(params.get("limit") || 24), 1), 48);
  const query = params.get("q")?.trim() || undefined;
  const taxonName = params.get("taxon")?.trim() || undefined;

  if (taxonName && (taxonName.length > 120 || !/[\p{L}]/u.test(taxonName) || /[\u0000-\u001f<>]/.test(taxonName))) {
    return NextResponse.json({ error: "Le nom taxonomique demandé est invalide." }, { status: 400 });
  }
  if (taxonName) {
    const limited = await enforceRateLimit(request, "naturalist-taxon-observations", { limit: 30, windowMs: 60_000 });
    if (limited) return limited;
  }

  try {
    const data = await inaturalistService.list({ page, perPage, group, query, taxonName });
    const observations = taxonName
      ? data.observations.map(({ id, sourceUrl, plantName, scientificName, imageUrl, photoAttribution, photoLicense, region, observedAt, observer }) => ({
          id, sourceUrl, plantName, scientificName, imageUrl, photoAttribution, photoLicense, region, observedAt, observer,
        }))
      : data.observations;
    return NextResponse.json({ source: "iNaturalist", attribution: "Données et photos par les observateurs iNaturalist", ...data, observations });
  } catch (error) {
    console.error("Erreur de récupération iNaturalist:", error);
    return NextResponse.json({ error: "Les observations iNaturalist sont temporairement indisponibles." }, { status: 502 });
  }
}


export const GET = withApiErrors(GETImpl);
