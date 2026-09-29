import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Math.max(Number(searchParams.get("radius") || 30), 1), 100);
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const posts = await prisma.communityPost.findMany({
      where: { removed: false, locationVisibility: "PUBLIC", observedAt: { gte: since }, latitude: { not: null }, longitude: { not: null } },
      select: { id: true, plantName: true, scientificName: true, organismGroup: true, region: true, observedAt: true, latitude: true, longitude: true },
      orderBy: { observedAt: "desc" },
      take: 1000,
    });
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
