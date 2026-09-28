import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../../lib/session";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { id, itemId } = await params;

    const exhibition = await prisma.exhibition.findUnique({ where: { id } });
    if (!exhibition) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }
    if (exhibition.userId !== sessionUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.exhibitionItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/my-exhibitions/[id]/items/[itemId]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
