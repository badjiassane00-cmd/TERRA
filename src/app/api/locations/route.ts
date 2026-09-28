import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { LocationType, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const type = searchParams.get("type");
    const season = searchParams.get("season");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");

    const where: Prisma.LocationWhereInput = {};

    if (region) {
      where.region = region;
    }

    if (type) {
      const normalizedType = type.toUpperCase().replace(/\s+/g, "_");
      if (Object.values(LocationType).includes(normalizedType as LocationType)) {
        where.type = normalizedType as LocationType;
      }
    }

    let locations = await prisma.location.findMany({
      where,
      include: {
        plants: {
          include: {
            plant: true,
          },
        },
      },
    });

    if (season) {
      locations = locations.filter((loc) => {
        let bloomingMonths: string[] | undefined;
        try {
          bloomingMonths = loc.bloomingMonths ? JSON.parse(loc.bloomingMonths) : undefined;
        } catch {
          bloomingMonths = undefined;
        }
        return !bloomingMonths || bloomingMonths.includes(season);
      });
    }

    if (lat && lng && radius) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      locations = locations.filter((loc) => {
        const distance = getDistanceFromLatLonInKm(
          centerLat,
          centerLng,
          loc.lat,
          loc.lng
        );
        return distance <= radiusKm;
      });
    }

    const enriched = locations.map((loc) => ({
      ...loc,
      bloomingMonths: typeof loc.bloomingMonths === "string" ? JSON.parse(loc.bloomingMonths) : loc.bloomingMonths,
      distance: lat && lng ? getDistanceFromLatLonInKm(parseFloat(lat), parseFloat(lng), loc.lat, loc.lng) : null,
    }));

    return NextResponse.json({
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des lieux:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

function getDistanceFromLatLonInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
