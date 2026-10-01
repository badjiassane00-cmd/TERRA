import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { followRepository } from "@/server/users/follow.repository";
import { userRepository } from "@/server/users/user.repository";
import { getSessionUserId } from "../../../../../lib/session";
import { createCommunityNotification } from "@/server/notifications/notification.service";
async function POSTImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const followerId = await getSessionUserId();
  if (!followerId) return NextResponse.json({ error: "Connectez-vous pour suivre ce naturaliste." }, { status: 401 });
  const { id: followedId } = await params;
  if (followedId === followerId) return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
  try {
    const actor = await userRepository.findName(followerId);
    const result = await followRepository.toggle(followerId, followedId);
    if (result.following && actor) await createCommunityNotification({ userId: followedId, actorName: actor.name, title: "Un nouveau naturaliste vous suit", body: "a rejoint votre communauté.", href: `/profile/${followerId}`, kind: "follow" }).catch((notificationError) => console.error("Notification abonnement:", notificationError));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur abonnement:", error);
    return NextResponse.json({ error: "Impossible de suivre ce naturaliste." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
