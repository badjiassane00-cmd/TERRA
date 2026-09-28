import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionUserId } from "../../../../lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exhibition = await prisma.exhibition.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            plant: {
              select: {
                id: true,
                scientificName: true,
                commonNames: true,
                family: true,
                imageUrl: true,
                medicinal: true,
              },
            },
          },
        },
      },
    });

    if (!exhibition) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }

    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error("Erreur GET /api/my-exhibitions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, theme, isPublic, coverImage } = body;

    const existing = await prisma.exhibition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }
    if (existing.userId !== sessionUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const exhibition = await prisma.exhibition.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
      },
    });

    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error("Erreur PATCH /api/my-exhibitions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.exhibition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }
    if (existing.userId !== sessionUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.exhibition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/my-exhibitions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
