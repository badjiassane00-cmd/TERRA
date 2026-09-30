import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getWeatherSnapshot } from "../../../lib/weather";
async function GETImpl(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  if (!process.env.OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: "Configuration requise : ajoutez OPENWEATHER_API_KEY dans .env.local (gratuit sur openweathermap.org)." },
      { status: 503 }
    );
  }

  const snapshot = await getWeatherSnapshot(lat, lng);
  if (!snapshot) {
    return NextResponse.json({ error: "Météo indisponible pour le moment." }, { status: 502 });
  }

  return NextResponse.json(snapshot);
}


export const GET = withApiErrors(GETImpl);
