import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour aimer cette observation." }, { status: 401 });
  const { id } = await params;
  try {
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
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur like:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour cette appréciation." }, { status: 500 });
  }
}
