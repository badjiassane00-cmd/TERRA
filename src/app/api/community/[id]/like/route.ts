import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../lib/session";
import { createCommunityNotification } from "@/server/notifications/notification.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour aimer cette observation." }, { status: 401 });
  const { id } = await params;
  try {
    const [post, actor] = await Promise.all([
      prisma.communityPost.findFirst({ where: { id, removed: false }, select: { userId: true, plantName: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.communityPostLike.findUnique({ where: { postId_userId: { postId: id, userId } } });
      if (existing) {
        await tx.communityPostLike.delete({ where: { id: existing.id } });
        const post = await tx.communityPost.update({ where: { id }, data: { likes: { decrement: 1 } }, select: { likes: true } });
        return { liked: false, likes: post.likes };
      }
      await tx.communityPostLike.create({ data: { postId: id, userId } });
      const post = await tx.communityPost.update({ where: { id }, data: { likes: { increment: 1 } }, select: { likes: true } });
      return { liked: true, likes: post.likes };
    });
    if (result.liked && post.userId !== userId && actor) await createCommunityNotification({ userId: post.userId, actorName: actor.name, title: "Votre observation plaît à quelqu’un", body: `a aimé votre observation « ${post.plantName} ».`, href: `/observations/${id}`, kind: "like" }).catch((notificationError) => console.error("Notification appréciation:", notificationError));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur like:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour cette appréciation." }, { status: 500 });
  }
}
