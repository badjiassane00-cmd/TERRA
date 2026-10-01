import { getSessionUserId } from "@/lib/session";
import { communityInteractionRepository } from "@/server/observations/community-interaction.repository";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

async function DELETEImpl(_request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour supprimer un commentaire." }, { status: 401 });
  const { id, commentId } = await params;
  const deleted = await communityInteractionRepository.deleteComment(id, commentId, userId);
  if (!deleted) return NextResponse.json({ error: "Commentaire introuvable ou vous n’en êtes pas l’auteur." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export const DELETE = withApiErrors(DELETEImpl);
