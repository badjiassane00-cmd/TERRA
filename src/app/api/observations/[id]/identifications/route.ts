import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour proposer une identification." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const taxonName = typeof body.taxonName === "string" ? body.taxonName.trim() : "";
    if (taxonName.length < 2 || taxonName.length > 180) return NextResponse.json({ error: "Saisissez un nom d’espèce valide." }, { status: 400 });
    const post = await prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    const identification = await prisma.communityIdentification.upsert({
      where: { postId_userId: { postId: id, userId } },
      create: { postId: id, userId, taxonName },
      update: { taxonName, createdAt: new Date() },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ identification }, { status: 201 });
  } catch (error) {
    console.error("Erreur suggestion d’identification:", error);
    return NextResponse.json({ error: "Impossible d’enregistrer cette identification." }, { status: 500 });
  }
}
