import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { exhibitionService } from "@/server/exhibitions/exhibition.service";
import { getSessionUserId } from "../../../lib/session";

// Liste des expositions personnelles. Pour ses propres expositions
// (privées + publiques), l'identité vient du cookie de session, jamais
// d'un paramètre envoyé par le client — sinon n'importe qui pourrait
// lire les expositions privées d'un autre utilisateur en changeant
// juste l'URL. ?publicOnly=true reste accessible sans session (vitrine
// publique, ne nécessite pas de compte).
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("publicOnly") === "true";

    if (publicOnly) {
      const exhibitions = await exhibitionService.listPublic();;
      return NextResponse.json({ exhibitions });
    }

    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const exhibitions = await exhibitionService.listForUser(sessionUserId);;

    return NextResponse.json({ exhibitions });
  } catch (error) {
    console.error("Erreur GET /api/my-exhibitions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, theme, isPublic } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title est requis" }, { status: 400 });
    }

    const exhibition = await exhibitionService.create({
        userId: sessionUserId,
        title,
        description: description || null,
        theme: theme || null,
        isPublic: Boolean(isPublic),
      });;

    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error("Erreur POST /api/my-exhibitions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
