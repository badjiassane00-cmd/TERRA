import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { localNameRepository } from "@/server/local-names/local-name.repository";
import { communityRepository } from "@/server/observations/community.repository";
import { requireModerator } from "../../../../lib/moderation";
import { getSessionUserId } from "../../../../lib/session";

// Tout ce qui attend une validation institutionnelle : noms locaux
// non vérifiés et publications communautaires non certifiées.
async function GETImpl() {
  try {
    const moderator = await requireModerator(await getSessionUserId());
    if (!moderator) {
      return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
    }

    const [pendingNames, pendingPosts] = await Promise.all([
      localNameRepository.findPending(),
      communityRepository.findPendingPosts(),
    ]);

    return NextResponse.json({ pendingNames, pendingPosts });
  } catch (error) {
    console.error("Erreur GET /api/institution/pending:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
