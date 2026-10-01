import { distanceKm } from "@/lib/geo";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { locationRepository } from "@/server/locations/location.repository";
import { LocationType, Prisma } from "@prisma/client";
async function GETImpl(request: Request) {
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

    let locations = await locationRepository.list(where);

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
        const distance = distanceKm(
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
      distance: lat && lng ? distanceKm(parseFloat(lat), parseFloat(lng), loc.lat, loc.lng) : null,
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



export const GET = withApiErrors(GETImpl);
