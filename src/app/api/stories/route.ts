import { getSessionUserId } from "@/lib/session";
import { communityRepository } from "@/server/observations/community.repository";
import { publicCoordinates } from "@/server/observations/location";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

async function GETImpl() {
  const viewerId = await getSessionUserId();
  if (!viewerId) return NextResponse.json({ error: "Connectez-vous pour voir les publications." }, { status: 401 });
  const stories = await communityRepository.listStories(viewerId);
  return NextResponse.json({ stories: stories.map((story) => ({
    id: story.id, userId: story.userId, user: story.user,
    imageUrl: story.thumbnailUrl || story.imageUrl, videoUrl: story.videoUrl,
    caption: story.description, createdAt: story.createdAt, expiresAt: story.expiresAt,
    liked: story.postLikes.length > 0, ...publicCoordinates(story, viewerId),
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export const GET = withApiErrors(GETImpl);
