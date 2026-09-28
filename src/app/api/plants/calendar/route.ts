import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function parseMonths(raw: string | null): number[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => n >= 1 && n <= 12) : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scientificName = searchParams.get("scientificName");
    if (!scientificName) {
      return NextResponse.json({ error: "scientificName requis" }, { status: 400 });
    }

    const plant = await prisma.plant.findUnique({
      where: { scientificName },
      select: {
        sowingMonths: true,
        bloomingMonths: true,
        harvestMonths: true,
        watering: true,
        sunlight: true,
      },
    });

    return NextResponse.json({
      sowingMonths: parseMonths(plant?.sowingMonths ?? null),
      bloomingMonths: parseMonths(plant?.bloomingMonths ?? null),
      harvestMonths: parseMonths(plant?.harvestMonths ?? null),
      watering: plant?.watering ?? null,
      sunlight: plant?.sunlight ?? null,
      hasSpecificData:
        parseMonths(plant?.sowingMonths ?? null).length > 0 ||
        parseMonths(plant?.bloomingMonths ?? null).length > 0 ||
        parseMonths(plant?.harvestMonths ?? null).length > 0,
    });
  } catch (error) {
    console.error("Erreur /api/plants/calendar:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
