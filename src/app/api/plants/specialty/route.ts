import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { plantRepository } from "@/server/plants/plant.repository";
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");

    // Les plantes à spécialité ont "specialty" dans leur JSON taxonomy
    const plants = await plantRepository.listSpecialty(specialty || undefined);

    const data = plants.map((plant) => {
      let characteristics: Record<string, unknown> = {};
      try { characteristics = JSON.parse(plant.taxonomy || "{}") as Record<string, unknown>; } catch { /* ignore */ }
      return {
        id: plant.id,
        scientificName: plant.scientificName,
        commonNames: (() => { try { return JSON.parse(plant.commonNames || "[]"); } catch { return []; } })(),
        description: plant.description,
        family: plant.family,
        imageUrl: plant.imageUrl,
        medicinal: plant.medicinal,
        characteristics: {
          specialty: characteristics.specialty,
          height: characteristics.height,
          leaves: characteristics.leaves,
          flowers: characteristics.flowers,
          fruits: characteristics.fruits,
          care: characteristics.care,
          blooming: characteristics.blooming,
        },
        localities: {
          nativeCountries: characteristics.nativeCountries || [],
          mappedLocations: plant.locations.map((lp) => ({
            name: lp.location.name,
            lat: lp.location.lat,
            lng: lp.location.lng,
            region: lp.location.region,
          })),
        },
      };
    });

    return NextResponse.json({ count: data.length, data });
  } catch (error) {
    console.error("Erreur specialty:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
