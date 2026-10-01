import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";
import { requireModerator } from "../../../../lib/moderation";
import { getSessionUserId } from "../../../../lib/session";

// Modération d'une publication communautaire : un compte
// Institution/Admin peut la certifier (identification confirmée) ou
// la retirer (contenu inapproprié / erroné). L'auteur peut aussi
// supprimer sa propre publication. L'identité vient toujours du cookie
// de session, jamais d'un champ envoyé par le client.
async function PATCHImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // action: "verify" | "remove" | "restore"

    const sessionUserId = await getSessionUserId();
    const moderator = await requireModerator(sessionUserId);
    if (!moderator) {
      return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
    }

    const data =
      action === "verify"
        ? { verified: true, verifiedBy: moderator.name }
        : action === "remove"
        ? { removed: true }
        : { removed: false };

    const post = await communityRepository.updatePost(id, data);
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Erreur PATCH /api/community/[id]:", error);
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

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const post = await communityRepository.findPost(id);
    if (!post) {
      return NextResponse.json({ error: "Publication introuvable" }, { status: 404 });
    }

    const isAuthor = post.userId === sessionUserId;
    const moderator = isAuthor ? null : await requireModerator(sessionUserId);

    if (!isAuthor && !moderator) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await communityRepository.deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/community/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const DELETE = withApiErrors(DELETEImpl);
