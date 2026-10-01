import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityInteractionRepository } from "@/server/observations/community-interaction.repository";
import { getSessionUserId } from "@/lib/session";
import { createCommunityNotification } from "@/server/notifications/notification.service";
async function POSTImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour répondre." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text || text.length > 2000) return NextResponse.json({ error: "Votre réponse doit contenir de 1 à 2 000 caractères." }, { status: 400 });
    const post = await communityInteractionRepository.findCommentTarget(id);
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const replyToId = typeof body.replyToId === "string" ? body.replyToId : null;
    const replyTarget = replyToId ? await communityInteractionRepository.findReplyTarget(id, replyToId) : null;
    if (replyToId && !replyTarget) return NextResponse.json({ error: "Le commentaire auquel vous répondez est introuvable." }, { status: 404 });
    const comment = await communityInteractionRepository.addComment({ postId: id, userId, body: text, replyToId });
    const recipients = new Set([replyTarget?.userId, post.userId].filter((recipient): recipient is string => Boolean(recipient && recipient !== userId)));
    await Promise.all([...recipients].map((recipientId) => createCommunityNotification({ userId: recipientId, actorName: comment.user.name, title: replyTarget ? "Quelqu’un a répondu à votre commentaire" : "Nouvelle réponse à votre observation", body: replyTarget ? `vous a répondu sur « ${post.plantName} » : « ${text.slice(0, 120)}${text.length > 120 ? "…" : ""} »` : `a commenté « ${post.plantName} » : « ${text.slice(0, 120)}${text.length > 120 ? "…" : ""} »`, href: `/observations/${id}#discussion`, kind: "comment" }).catch((notificationError: unknown) => console.error("Notification commentaire:", notificationError))));
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout réponse:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer votre réponse." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
