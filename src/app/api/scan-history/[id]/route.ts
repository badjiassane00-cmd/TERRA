import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionUserId } from "../../../../lib/session";

// Permet à un étudiant de rattacher un relevé déjà enregistré à un
// contexte pédagogique (nom du cours/TP, objectif de l'observation),
// sans devoir tout ressaisir au moment du scan sur le terrain.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { courseName, objective } = body;

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const scan = await prisma.scanHistory.findUnique({ where: { id } });
    if (!scan) {
      return NextResponse.json({ error: "Relevé introuvable" }, { status: 404 });
    }
    if (scan.userId !== sessionUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updated = await prisma.scanHistory.update({
      where: { id },
      data: {
        ...(courseName !== undefined ? { courseName: courseName || null } : {}),
        ...(objective !== undefined ? { objective: objective || null } : {}),
      },
    });

    return NextResponse.json({ scan: updated });
  } catch (error) {
    console.error("Erreur PATCH /api/scan-history/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
