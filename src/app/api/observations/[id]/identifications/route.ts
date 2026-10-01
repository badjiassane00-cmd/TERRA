import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { communityInteractionRepository } from "@/server/observations/community-interaction.repository";
import { getSessionUserId } from "@/lib/session";
import { createCommunityNotification } from "@/server/notifications/notification.service";
async function POSTImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour proposer une identification." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const taxonName = typeof body.taxonName === "string" ? body.taxonName.trim() : "";
    if (taxonName.length < 2 || taxonName.length > 180) return NextResponse.json({ error: "Saisissez un nom d’espèce valide." }, { status: 400 });
    const post = await communityInteractionRepository.findIdentificationTarget(id);
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const identification = await communityInteractionRepository.upsertIdentification({ postId: id, userId, taxonName });
    if (post.userId !== userId) await createCommunityNotification({ userId: post.userId, actorName: identification.user.name, title: "Une identification a été proposée", body: `a proposé « ${taxonName} » pour votre observation.`, href: `/observations/${id}#identification`, kind: "identification" }).catch((notificationError) => console.error("Notification identification:", notificationError));
    return NextResponse.json({ identification }, { status: 201 });
  } catch (error) {
    console.error("Erreur suggestion d’identification:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer cette identification." }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
