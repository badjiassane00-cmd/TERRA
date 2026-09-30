import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../lib/session";
import { createCommunityNotification } from "@/server/notifications/notification.service";
async function POSTImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const followerId = await getSessionUserId();
  if (!followerId) return NextResponse.json({ error: "Connectez-vous pour suivre ce naturaliste." }, { status: 401 });
  const { id: followedId } = await params;
  if (followedId === followerId) return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
  try {
    const actor = await prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({ where: { followerId_followedId: { followerId, followedId } } });
      if (existing) {
        await tx.userFollow.delete({ where: { id: existing.id } });
        return { following: false, followers: await tx.userFollow.count({ where: { followedId } }) };
      }
      await tx.userFollow.create({ data: { followerId, followedId } });
      return { following: true, followers: await tx.userFollow.count({ where: { followedId } }) };
    });
    if (result.following && actor) await createCommunityNotification({ userId: followedId, actorName: actor.name, title: "Un nouveau naturaliste vous suit", body: "a rejoint votre communauté.", href: `/profile/${followerId}`, kind: "follow" }).catch((notificationError) => console.error("Notification abonnement:", notificationError));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur abonnement:", error);
    return NextResponse.json({ error: "Impossible de suivre ce naturaliste." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
