import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { localNameRepository } from "@/server/local-names/local-name.repository";
import { requireModerator } from "../../../lib/moderation";
import { getSessionUserId } from "../../../lib/session";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedJson } from "@/server/http/read-limited-form-data";
import { ApiError } from "@/server/http/api-handler";

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

    const plant = await localNameRepository.listForPlant(scientificName);

    return NextResponse.json({ names: plant?.localNames ?? [] });
  } catch (error) {
    console.error("Erreur GET /api/local-names:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  try {
    const limited = await enforceRateLimit(request, "local-name-contribution", { limit: 20, windowMs: 60_000 });
    if (limited) return limited;
    const body = await readLimitedJson<Record<string, unknown>>(request, 8192);
    const scientificName = typeof body.scientificName === "string" ? body.scientificName.trim() : "";
    const language = typeof body.language === "string" ? body.language.trim() : "";
    const languageName = typeof body.languageName === "string" ? body.languageName.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!scientificName || !language || !languageName || !name || scientificName.length > 180 || language.length > 16 || languageName.length > 80 || name.length > 120) {
      return NextResponse.json(
        { error: "scientificName, language, languageName et name sont requis" },
        { status: 400 }
      );
    }

    // On crée la fiche plante minimale si elle n'existe pas encore
    // (une contribution de nom local ne doit pas dépendre d'un scan
    // préalable enregistré en base).
    const contributor = await getSessionUserId();
    const localName = await localNameRepository.add({ scientificName, language, languageName, name, contributedBy: contributor });

    return NextResponse.json({ localName });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
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

    const localName = await localNameRepository.verify(id);

    return NextResponse.json({ localName });
  } catch (error) {
    console.error("Erreur PATCH /api/local-names:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
