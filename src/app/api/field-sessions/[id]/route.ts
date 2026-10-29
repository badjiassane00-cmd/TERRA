import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";
import { getSessionUserId } from "../../../../lib/session";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedJson } from "@/server/http/read-limited-form-data";
import { ApiError } from "@/server/http/api-handler";

// Détail d'une session avec la liste des relevés déjà soumis — appelée
// en polling côté superviseur pour un effet "temps réel" simple, sans
// dépendance websocket.
async function GETImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    const limited = await enforceRateLimit(request, `field-session-detail:${userId}`, { limit: 60, windowMs: 60_000 });
    if (limited) return limited;
    const { id } = await params;
    const summary = await fieldSessionService.findSummaryById(id);

    if (!summary) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (summary.supervisorId !== userId) {
      if (!summary.active) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      return NextResponse.json({ session: summary });
    }

    const session = await fieldSessionService.findById(id);

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
    const body = await readLimitedJson<{ active?: unknown }>(request, 1024);
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "État de session invalide" }, { status: 400 });

    const result = await fieldSessionService.setActive(id, sessionUserId, body.active);
    if (result.kind === "missing") return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const session = result.session;

    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erreur PATCH /api/field-sessions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
