import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const scans = await prisma.scanHistory.findMany({
      where: { userId: sessionUserId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
