import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

interface PlantNetSpecies {
  name?: string;
  scientificName?: string;
}

interface PlantNetResult {
  species?: PlantNetSpecies;
  [key: string]: unknown;
}

const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY || "";
const PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    if (!PLANTNET_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Pl@ntNet non configurée" },
        { status: 500 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const plantnetFormData = new FormData();
    plantnetFormData.append("images", new Blob([buffer], { type: image.type }), image.name);
    plantnetFormData.append("organs", "auto");

    const response = await fetch(`${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}`, {
      method: "POST",
      body: plantnetFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pl@ntNet API error:", errorText);
      return NextResponse.json(
        { error: `Erreur API Pl@ntNet: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const enrichedResults = await Promise.all(
      (data.results || []).slice(0, 10).map(async (result: PlantNetResult) => {
        const speciesName = result.species?.name || result.species?.scientificName;
        if (!speciesName) return result;

        const existingPlant = await prisma.plant.findFirst({
          where: {
            OR: [
              { scientificName: { contains: speciesName } },
              { commonNames: { contains: speciesName } },
            ],
          },
          select: {
            id: true,
            description: true,
            medicinal: true,
            watering: true,
            sunlight: true,
            soil: true,
            toxicity: true,
            edibleParts: true,
          },
        });

        return {
          ...result,
          enrichedData: existingPlant || null,
        };
      })
    );

    return NextResponse.json({
      source: "plantnet",
      count: enrichedResults.length,
      results: enrichedResults,
    });
  } catch (error) {
    console.error("Erreur Pl@ntNet:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'identification Pl@ntNet" },
      { status: 500 }
    );
  }
}
