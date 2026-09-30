import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/session";

// Barème serveur fixe par type d'action : on ne fait jamais confiance
// à une valeur de points envoyée par le client (sinon n'importe qui
// pourrait s'attribuer des points arbitraires via un appel direct à
// cette route, sans même passer par l'interface).
const POINTS_BY_ACTION: Record<string, number> = {
  scan: 10,
  disease: 20,
  challenge: 30,
  daily_login: 5,
};
async function GETImpl() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const profile = await prisma.gamificationProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const newProfile = await prisma.gamificationProfile.create({
        data: {
          userId,
          points: 0,
          level: 1,
          badges: "[]",
          streak: 1,
        },
      });
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur gamification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const points = POINTS_BY_ACTION[action] ?? 0;

    const profile = await prisma.gamificationProfile.upsert({
      where: { userId },
      update: {
        points: { increment: points },
        streak: action === "daily_login" ? { increment: 1 } : undefined,
      },
      create: {
        userId,
        points,
        level: 1,
        badges: "[]",
        streak: 1,
      },
    });

    // Recalcul du niveau (100 XP par niveau)
    const newLevel = Math.floor(profile.points / 100) + 1;
    let badges: string[] = [];
    try {
      badges = JSON.parse(profile.badges || "[]");
    } catch {
      badges = [];
    }

    // Déblocage automatique des badges selon les points cumulés
    const autoBadges: Array<{ id: string; threshold: number }> = [
      { id: "first_scan", threshold: 10 },
      { id: "botanist", threshold: 100 },
      { id: "expert", threshold: 500 },
    ];
    let badgesChanged = false;
    for (const { id, threshold } of autoBadges) {
      if (profile.points >= threshold && !badges.includes(id)) {
        badges.push(id);
        badgesChanged = true;
      }
    }

    const updated = await prisma.gamificationProfile.update({
      where: { userId },
      data: {
        level: newLevel,
        badges: badgesChanged ? JSON.stringify(badges) : undefined,
      },
    });

    return NextResponse.json({
      ...updated,
      badges: (() => {
        try {
          return JSON.parse(updated.badges || "[]");
        } catch {
          return [];
        }
      })(),
    });
  } catch (error) {
    console.error("Erreur mise à jour gamification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


export const POST = withApiErrors(POSTImpl);
