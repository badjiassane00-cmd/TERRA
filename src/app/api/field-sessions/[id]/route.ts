import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";
import { getSessionUserId } from "../../../../lib/session";

// Détail d'une session avec la liste des relevés déjà soumis — appelée
// en polling côté superviseur pour un effet "temps réel" simple, sans
// dépendance websocket.
async function GETImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await fieldSessionService.findById(id);

    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur GET /api/field-sessions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export const GET = withApiErrors(GETImpl);

async function PATCHImpl(
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
    const { active } = body;

    const result = await fieldSessionService.setActive(id, sessionUserId, Boolean(active));
    if (result.kind === "missing") return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const session = result.session;

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur PATCH /api/field-sessions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
