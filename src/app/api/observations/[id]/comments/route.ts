import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const post = await prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true, userId: true, plantName: true } });
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.communityComment.create({ data: { postId: id, userId, body: text }, include: { user: { select: { id: true, name: true } } } });
      await tx.communityPost.update({ where: { id }, data: { comments: { increment: 1 } } });
      return created;
    });
    if (post.userId !== userId) await createCommunityNotification({ userId: post.userId, actorName: comment.user.name, title: "Nouvelle réponse à votre observation", body: `a commenté « ${post.plantName} » : « ${text.slice(0, 120)}${text.length > 120 ? "…" : ""} »`, href: `/observations/${id}#discussion`, kind: "comment" }).catch((notificationError) => console.error("Notification commentaire:", notificationError));
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout réponse:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer votre réponse." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
