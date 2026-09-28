import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Liste légère des plantes pour le matching local côté client
// (utilisé par AIPlantRecognition). Auparavant cette requête tournait
// directement dans le navigateur via un import dynamique de
// @prisma/client — ce qui est invalide (Prisma ne s'exécute pas côté
// client) et exposait potentiellement la logique d'accès aux données.
export async function GET() {
  try {
    const allPlants = await prisma.plant.findMany({
      select: {
        id: true,
        scientificName: true,
        commonNames: true,
        family: true,
        description: true,
        medicinal: true,
        watering: true,
        sunlight: true,
        soil: true,
      },
    });

    const plants = allPlants.map((plant) => ({
      ...plant,
      commonNames:
        typeof plant.commonNames === "string"
          ? JSON.parse(plant.commonNames)
          : plant.commonNames,
    }));

    return NextResponse.json({ plants });
  } catch (error) {
    console.error("Erreur /api/plants/list:", error);
    return NextResponse.json(
      { error: "Impossible de charger la liste des plantes" },
      { status: 500 }
    );
  }
}
