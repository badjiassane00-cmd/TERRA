import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";


interface EnrichedData {
  [key: string]: unknown;
}

interface PlantNetResultItem {
  species?: {
    name?: string;
    scientificName?: string;
    enrichedData?: EnrichedData;
  };
  score?: number;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const userId = formData.get("userId") as string | null;

    if (!image) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    // Pl@ntNet attend un champ "images" (rebuild du formData)
    const bytes = await image.arrayBuffer();
    const plantnetForm = new FormData();
    plantnetForm.append("images", new Blob([bytes], { type: image.type }), image.name);
    plantnetForm.append("organs", "auto");

    const plantnetResponse = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`,
      {
        method: "POST",
        body: plantnetForm,
        signal: AbortSignal.timeout(15_000),
      }
    );
    const plantnetData = plantnetResponse.ok ? await plantnetResponse.json() : {};

    const candidates: Array<{
      name: string;
      scientificName: string;
      source: string;
      confidence: number;
      enrichedData?: EnrichedData;
    }> = [];

    if (plantnetData.results?.length > 0) {
      plantnetData.results.forEach((result: PlantNetResultItem) => {
        const speciesName = result.species?.name || result.species?.scientificName || "Espèce inconnue";
        candidates.push({
          name: speciesName,
          scientificName: speciesName,
          source: "plantnet",
          confidence: result.score || 0,
          enrichedData: result.species?.enrichedData,
        });
      });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);

    const topCandidates = candidates.slice(0, 5);

    if (topCandidates.length > 0 && userId) {
      // Résolution de l'utilisateur ("demo" → utilisateur démo)
      let scanUserId = userId;
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        const demoUser = await prisma.user.findUnique({
          where: { email: "demo@botanique.app" },
        });
        if (!demoUser) scanUserId = "";
        else scanUserId = demoUser.id;
      }

      if (scanUserId) {
      const top = topCandidates[0];
      let plant = await prisma.plant.findFirst({
        where: { scientificName: { contains: top.scientificName, mode: "insensitive" } },
      });

      if (!plant) {
        plant = await prisma.plant.create({
          data: {
            scientificName: top.scientificName,
            commonNames: JSON.stringify([top.name]),
            description: typeof top.enrichedData?.description === "string"
              ? top.enrichedData.description
              : `Identifié via ${top.source}`,
            taxonomy: JSON.stringify({ genus: top.scientificName.split(" ")[0] }),
          },
        });
      }

      await prisma.scanHistory.create({
        data: {
          userId: scanUserId,
          plantId: plant.id,
          result: JSON.stringify({ candidates: topCandidates, source: "ensemble" }),
        },
      });
      }
    }

    return NextResponse.json({
      source: "ensemble",
      candidates: topCandidates,
      totalCandidates: candidates.length,
    });
  } catch (error) {
    console.error("Erreur identification ensemble:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'identification" },
      { status: 500 }
    );
  }
}
