import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { scanHistoryRepository } from "@/server/scan-history/scan-history.repository";
import { getSessionUserId } from "../../../lib/session";
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const scans = await scanHistoryRepository.listForUser(sessionUserId, limit);

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


export const GET = withApiErrors(GETImpl);
