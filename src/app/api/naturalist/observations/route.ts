import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { ORGANISM_GROUPS, type OrganismGroup } from "@/types/nature";
import { inaturalistService } from "@/server/inaturalist/inaturalist.service";
async function GETImpl(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedGroup = params.get("group");
  const group = requestedGroup && ORGANISM_GROUPS.includes(requestedGroup as OrganismGroup)
    ? requestedGroup as OrganismGroup
    : undefined;
  const page = Math.min(Math.max(Number(params.get("page") || 1), 1), 100);
  const perPage = Math.min(Math.max(Number(params.get("limit") || 24), 1), 48);
  const query = params.get("q")?.trim() || undefined;

  try {
    const data = await inaturalistService.list({ page, perPage, group, query });
    return NextResponse.json({ source: "iNaturalist", attribution: "Données et photos par les observateurs iNaturalist", ...data });
  } catch (error) {
    console.error("Erreur de récupération iNaturalist:", error);
    return NextResponse.json({ error: "Les observations iNaturalist sont temporairement indisponibles." }, { status: 502 });
  }
}


export const GET = withApiErrors(GETImpl);
