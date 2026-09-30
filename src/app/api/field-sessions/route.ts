import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/session";

function generateCode(): string {
  // Code court, lisible à l'oral pour le communiquer sur le terrain
  // sans ambiguïté (pas de 0/O ni 1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function GET() {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const sessions = await prisma.fieldSession.findMany({
      where: { supervisorId: sessionUserId },
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Erreur GET /api/field-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = await request.json();
    const { title, courseName } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title est requis" }, { status: 400 });
    }

    let code = generateCode();
    // Évite (très rare) une collision de code entre deux sessions actives.
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await prisma.fieldSession.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode();
    }

    const session = await prisma.fieldSession.create({
      data: { code, title: title.trim(), courseName: courseName || null, supervisorId: sessionUserId },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur POST /api/field-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
