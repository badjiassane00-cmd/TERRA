import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour répondre." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text || text.length > 2000) return NextResponse.json({ error: "Votre réponse doit contenir de 1 à 2 000 caractères." }, { status: 400 });
    const post = await prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.communityComment.create({ data: { postId: id, userId, body: text }, include: { user: { select: { id: true, name: true } } } });
      await tx.communityPost.update({ where: { id }, data: { comments: { increment: 1 } } });
      return created;
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout réponse:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer votre réponse." }, { status: 500 });
  }
}
