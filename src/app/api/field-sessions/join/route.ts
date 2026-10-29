import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";
import { getSessionUserId } from "@/lib/session";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedJson } from "@/server/http/read-limited-form-data";
import { ApiError } from "@/server/http/api-handler";

// Un étudiant rejoint une session via le code communiqué à l'oral sur
// le terrain par l'encadrant.
async function POSTImpl(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    const limited = await enforceRateLimit(request, "field-session-join", { limit: 5, windowMs: 60_000 });
    if (limited) return limited;
    const body = await readLimitedJson<{ code?: unknown }>(request, 1024);
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/.test(code)) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const session = await fieldSessionService.join(code);

    if (!session || !session.active) {
      return NextResponse.json(
        { error: "Code invalide ou session terminée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: { id: session.id } });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erreur POST /api/field-sessions/join:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
