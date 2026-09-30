import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { inaturalistService } from "@/server/inaturalist/inaturalist.service";
async function GETImpl(request: Request) {
  const { searchParams } = new URL(request.url);
  const scientificName = searchParams.get("scientificName")?.trim();
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));
  if (!scientificName) return NextResponse.json({ error: "Nom scientifique requis." }, { status: 400 });
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }
  try {
    const data = await inaturalistService.nearby({ scientificName, latitude, longitude });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Les observations terrain sont indisponibles pour le moment." }, { status: 502 });
  }
}


export const GET = withApiErrors(GETImpl);
