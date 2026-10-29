import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";
import { requireModerator } from "../../../../lib/moderation";
import { getSessionUserId } from "../../../../lib/session";
import { readLimitedJson } from "@/server/http/read-limited-form-data";
import { parseModerationAction } from "@/server/observations/moderation-action";

// Modération d'une publication communautaire : un compte
// Institution/Admin peut la certifier (identification confirmée) ou
// la retirer (contenu inapproprié / erroné). L'auteur peut aussi
// supprimer sa propre publication. L'identité vient toujours du cookie
// de session, jamais d'un champ envoyé par le client.
async function PATCHImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUserId = await getSessionUserId();
  const moderator = await requireModerator(sessionUserId);
  if (!moderator) {
    return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
  }

  const body = await readLimitedJson<{ action?: unknown }>(request, 16_384);
  const action = body && typeof body === "object" ? parseModerationAction(body.action) : null;
  if (!action) throw new ApiError("Action de modération invalide.", 400);
  const { id } = await params;
  const data = action === "verify"
    ? { verified: true, verifiedBy: moderator.name }
    : action === "remove"
      ? { removed: true }
      : { removed: false };
  const post = await communityRepository.updatePost(id, data);
  return NextResponse.json({ post });
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
