import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireModerator } from "../../../lib/moderation";
import { getSessionUserId } from "../../../lib/session";

// Noms vernaculaires en langues locales (wolof, bambara, peul...),
// contribués par la communauté. Un même nom scientifique peut avoir
// plusieurs noms par langue ; les plus votés remontent en premier.
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scientificName = searchParams.get("scientificName");

    if (!scientificName) {
      return NextResponse.json({ error: "scientificName requis" }, { status: 400 });
    }

    const plant = await prisma.plant.findUnique({
      where: { scientificName },
      select: {
        localNames: {
          orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json({ names: plant?.localNames ?? [] });
  } catch (error) {
    console.error("Erreur GET /api/local-names:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  try {
    const body = await request.json();
    const { scientificName, language, languageName, name, contributedBy } = body;

    if (!scientificName || !language || !languageName || !name) {
      return NextResponse.json(
        { error: "scientificName, language, languageName et name sont requis" },
        { status: 400 }
      );
    }

    // On crée la fiche plante minimale si elle n'existe pas encore
    // (une contribution de nom local ne doit pas dépendre d'un scan
    // préalable enregistré en base).
    const plant = await prisma.plant.upsert({
      where: { scientificName },
      update: {},
      create: { scientificName },
    });

    const localName = await prisma.localName.upsert({
      where: {
        plantId_language_name: {
          plantId: plant.id,
          language,
          name,
        },
      },
      update: { votes: { increment: 1 } },
      create: {
        plantId: plant.id,
        language,
        languageName,
        name,
        contributedBy: contributedBy || null,
      },
    });

    return NextResponse.json({ localName });
  } catch (error) {
    console.error("Erreur POST /api/local-names:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const POST = withApiErrors(POSTImpl);// Un compte Institution/Admin certifie qu'un nom local est correct
// (utile car ces noms sont contribués librement par la communauté).
async function PATCHImpl(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const sessionUserId = await getSessionUserId();
    const moderator = await requireModerator(sessionUserId);
    if (!moderator) {
      return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
    }

    const localName = await prisma.localName.update({
      where: { id },
      data: { verified: true },
    });

    return NextResponse.json({ localName });
  } catch (error) {
    console.error("Erreur PATCH /api/local-names:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
