import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { ReminderType } from "@prisma/client";
import { getWeatherSnapshot } from "../../../lib/weather";
import { getSessionUserId } from "../../../lib/session";

const TYPE_MAP: Record<string, string> = {
  watering: "WATERING",
  sunlight: "SUNLIGHT",
  fertilizing: "FERTILIZING",
  pruning: "PRUNING",
};

const TYPE_REVERSE: Record<string, string> = {
  WATERING: "watering",
  SUNLIGHT: "sunlight",
  FERTILIZING: "fertilizing",
  PRUNING: "pruning",
};

const INTERVALS: Record<string, number> = {
  daily: 86400000,
  weekly: 7 * 86400000,
  monthly: 30 * 86400000,
};

// Arrondi léger des coordonnées pour regrouper les appels météo
// (inutile d'interroger l'API une fois par rappel si plusieurs
// rappels partagent la même zone).
function weatherCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}
async function GETImpl() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { nextReminder: "asc" },
    });

    // Enrichissement météo : un seul appel par zone géographique distincte,
    // uniquement pour les rappels d'arrosage géolocalisés.
    const weatherCache = new Map<string, Awaited<ReturnType<typeof getWeatherSnapshot>>>();
    const weatherEligible = reminders.filter(
      (r) => r.type === "WATERING" && r.lat != null && r.lng != null
    );
    await Promise.all(
      weatherEligible.map(async (r) => {
        const key = weatherCacheKey(r.lat as number, r.lng as number);
        if (!weatherCache.has(key)) {
          weatherCache.set(key, await getWeatherSnapshot(r.lat as number, r.lng as number));
        }
      })
    );

    return NextResponse.json({
      count: reminders.length,
      data: reminders.map((r) => {
        const weather =
          r.type === "WATERING" && r.lat != null && r.lng != null
            ? weatherCache.get(weatherCacheKey(r.lat, r.lng)) ?? null
            : null;

        return {
          id: r.id,
          type: TYPE_REVERSE[r.type] || r.type.toLowerCase(),
          plantName: r.plantName,
          frequency: r.frequency,
          time: r.time,
          enabled: r.enabled,
          nextReminder: r.nextReminder,
          weatherAdvice: weather?.advice || null,
          skipSuggested: weather?.willRainSoon ?? false,
        };
      }),
    });
  } catch (error) {
    console.error("Erreur reminders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
    const { type, plantName, frequency, time, lat, lng } = body;

    if (!plantName) {
      return NextResponse.json({ error: "Nom de plante requis" }, { status: 400 });
    }

    const interval = INTERVALS[frequency] || INTERVALS.weekly;

    const hasCoords =
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        type: (TYPE_MAP[type] || "WATERING") as ReminderType,
        plantName,
        frequency: frequency || "weekly",
        time: time || "08:00",
        enabled: true,
        nextReminder: new Date(Date.now() + interval),
        lat: hasCoords ? lat : null,
        lng: hasCoords ? lng : null,
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Erreur création reminder:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const POST = withApiErrors(POSTImpl);

async function PATCHImpl(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = await request.json();
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "Id requis" }, { status: 400 });
    }

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: { enabled },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Erreur maj reminder:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const PATCH = withApiErrors(PATCHImpl);

async function DELETEImpl(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Id requis" }, { status: 400 });
    }

    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression reminder:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const DELETE = withApiErrors(DELETEImpl);
