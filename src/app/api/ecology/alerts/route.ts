import { distanceKm } from "@/lib/geo";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";

async function GETImpl(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Math.max(Number(searchParams.get("radius") || 30), 1), 100);
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const posts = await communityRepository.findForLocalAlerts(since);
    const alerts = posts.flatMap((post) => {
      const km = distanceKm(lat, lng, post.latitude!, post.longitude!);
      return km <= radius ? [{ id: post.id, name: post.plantName, scientificName: post.scientificName, group: post.organismGroup, region: post.region, observedAt: post.observedAt, distanceKm: Math.round(km) }] : [];
    });
    return NextResponse.json({ radiusKm: radius, count: alerts.length, alerts: alerts.slice(0, 20) });
  } catch (error) {
    console.error("Erreur alertes de proximité:", error);
    return NextResponse.json({ error: "Les alertes locales sont indisponibles." }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
