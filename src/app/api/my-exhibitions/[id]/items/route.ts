import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plantId, scientificName, commonName, imageUrl, note } = body;

    const exhibition = await prisma.exhibition.findUnique({ where: { id } });
    if (!exhibition) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }
    if (exhibition.userId !== sessionUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    let resolvedPlantId = plantId;
    if (!resolvedPlantId) {
      if (!scientificName) {
        return NextResponse.json(
          { error: "plantId ou scientificName requis" },
          { status: 400 }
        );
      }
      const plant = await prisma.plant.upsert({
        where: { scientificName },
        update: {},
        create: {
          scientificName,
          commonNames: commonName ? JSON.stringify([commonName]) : "[]",
          imageUrl: imageUrl || null,
        },
      });
      resolvedPlantId = plant.id;
    }

    const itemCount = await prisma.exhibitionItem.count({ where: { exhibitionId: id } });

    const item = await prisma.exhibitionItem.upsert({
      where: { exhibitionId_plantId: { exhibitionId: id, plantId: resolvedPlantId } },
      update: { note: note ?? undefined, imageUrl: imageUrl ?? undefined },
      create: {
        exhibitionId: id,
        plantId: resolvedPlantId,
        note: note || null,
        imageUrl: imageUrl || null,
        position: itemCount,
      },
      include: { plant: true },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Erreur POST /api/my-exhibitions/[id]/items:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
