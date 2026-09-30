import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { identificationService } from "@/server/identification/identification.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    const result = await identificationService.identify(image);
    const userId = await getSessionUserId();
    const top = result.candidates[0];
    if (top && userId) {
      let plant = await prisma.plant.findFirst({ where: { scientificName: { contains: top.scientificName } } });
      if (!plant) plant = await prisma.plant.create({ data: { scientificName: top.scientificName, commonNames: JSON.stringify([top.name]), description: typeof top.enrichedData?.description === "string" ? top.enrichedData.description : `Identifié via ${top.source}`, taxonomy: JSON.stringify({ genus: top.scientificName.split(" ")[0] }) } });
      await prisma.scanHistory.create({ data: { userId, plantId: plant.id, result: JSON.stringify({ candidates: result.candidates, source: result.source }) } });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur identification ensemble:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur lors de l'identification" }, { status: 502 });
  }
}
