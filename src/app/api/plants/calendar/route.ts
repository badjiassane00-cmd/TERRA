import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { plantRepository } from "@/server/plants/plant.repository";

function parseMonths(raw: string | null): number[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => n >= 1 && n <= 12) : [];
  } catch {
    return [];
  }
}
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scientificName = searchParams.get("scientificName");
    if (!scientificName) {
      return NextResponse.json({ error: "scientificName requis" }, { status: 400 });
    }

    const plant = await plantRepository.findCalendar(scientificName);

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


export const GET = withApiErrors(GETImpl);
