import { NextResponse } from "next/server";

const INATURALIST_API = "https://api.inaturalist.org/v1/observations";
type RawObservation = {
  id: number;
  observed_on?: string;
  created_at?: string;
  user?: { login?: string };
  place_guess?: string;
  photos?: Array<{ url?: string }>;
  uri: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scientificName = searchParams.get("scientificName")?.trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!scientificName) return NextResponse.json({ error: "Nom scientifique requis." }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  const params = new URLSearchParams({
    taxon_name: scientificName,
    lat: String(lat),
    lng: String(lng),
    radius: "50",
    quality_grade: "research",
    photos: "true",
    per_page: "6",
    order_by: "observed_on",
    order: "desc",
  });

  try {
    const response = await fetch(`${INATURALIST_API}?${params}`, {
      headers: { Accept: "application/json", "User-Agent": "SunuNature/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("iNaturalist unavailable");
    const data = await response.json();
    const sightings = ((data.results || []) as RawObservation[]).map((observation) => ({
      id: observation.id,
      observedOn: observation.observed_on || observation.created_at,
      observer: observation.user?.login || "Observateur iNaturalist",
      place: observation.place_guess || "Lieu non précisé",
      photo: observation.photos?.[0]?.url?.replace("square", "medium") || null,
      url: observation.uri,
    }));
    return NextResponse.json({ total: data.total_results || sightings.length, sightings });
  } catch {
    return NextResponse.json({ error: "Les observations terrain sont indisponibles pour le moment." }, { status: 502 });
  }
}
