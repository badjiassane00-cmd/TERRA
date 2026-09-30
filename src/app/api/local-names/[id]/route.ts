import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { localNameRepository } from "@/server/local-names/local-name.repository";
import { requireModerator } from "../../../../lib/moderation";
import { getSessionUserId } from "../../../../lib/session";

// Valider (ou retirer) un nom local contribué par la communauté —
// réservé aux comptes Institution/Admin. Le rôle est relu en base,
// jamais fait confiance à ce qu'envoie le client.
async function PATCHImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moderator = await requireModerator(await getSessionUserId());
    if (!moderator) {
      return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
    }

    const localName = await localNameRepository.verify(id, moderator.name);

    return NextResponse.json({ localName });
  } catch (error) {
    console.error("Erreur PATCH /api/local-names/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const PATCH = withApiErrors(PATCHImpl);

async function DELETEImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moderator = await requireModerator(await getSessionUserId());
    if (!moderator) {
      return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
    }

    await localNameRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/local-names/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const DELETE = withApiErrors(DELETEImpl);
