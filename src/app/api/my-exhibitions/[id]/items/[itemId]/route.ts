import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { exhibitionService } from "@/server/exhibitions/exhibition.service";
import { getSessionUserId } from "../../../../../../lib/session";
async function DELETEImpl(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { id, itemId } = await params;

    const result = await exhibitionService.removePlant(id, itemId, sessionUserId);
    if (result === "missing") return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    if (result === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (result === "item-missing") return NextResponse.json({ error: "Plante introuvable dans cette exposition" }, { status: 404 });
        return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/my-exhibitions/[id]/items/[itemId]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const DELETE = withApiErrors(DELETEImpl);
