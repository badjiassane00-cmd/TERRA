import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityRepository } from "@/server/observations/community.repository";
import { getSessionUserId } from "../../../../../lib/session";
import { userRepository } from "@/server/users/user.repository";
import { createCommunityNotification } from "@/server/notifications/notification.service";
async function POSTImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour aimer cette observation." }, { status: 401 });
  const { id } = await params;
  try {
    const [post, actor] = await Promise.all([
      communityRepository.findVisiblePost(id),
      userRepository.findName(userId),
    ]);
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const result = await communityRepository.toggleLike(id, userId);
    if (result.liked && post.userId !== userId && actor) await createCommunityNotification({ userId: post.userId, actorName: actor.name, title: "Votre observation plaît à quelqu’un", body: `a aimé votre observation « ${post.plantName} ».`, href: `/observations/${id}`, kind: "like" }).catch((notificationError) => console.error("Notification appréciation:", notificationError));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur like:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour cette appréciation." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
