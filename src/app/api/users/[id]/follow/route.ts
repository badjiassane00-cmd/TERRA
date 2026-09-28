import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUserId } from "../../../../../lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const followerId = await getSessionUserId();
  if (!followerId) return NextResponse.json({ error: "Connectez-vous pour suivre ce naturaliste." }, { status: 401 });
  const { id: followedId } = await params;
  if (followedId === followerId) return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({ where: { followerId_followedId: { followerId, followedId } } });
      if (existing) {
        await tx.userFollow.delete({ where: { id: existing.id } });
        return { following: false, followers: await tx.userFollow.count({ where: { followedId } }) };
      }
      await tx.userFollow.create({ data: { followerId, followedId } });
      return { following: true, followers: await tx.userFollow.count({ where: { followedId } }) };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur abonnement:", error);
    return NextResponse.json({ error: "Impossible de suivre ce naturaliste." }, { status: 500 });
  }
}
