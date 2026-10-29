import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";
import { getSessionUserId } from "../../../lib/session";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedJson } from "@/server/http/read-limited-form-data";
import { ApiError } from "@/server/http/api-handler";

async function GETImpl() {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const sessions = await fieldSessionService.listForSupervisor(sessionUserId);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Erreur GET /api/field-sessions:", error);
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

    const limited = await enforceRateLimit(request, `field-session-create:${sessionUserId}`, { limit: 5, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readLimitedJson<Record<string, unknown>>(request, 8192);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const courseName = typeof body.courseName === "string" ? body.courseName.trim() : null;

    if (!title || title.length > 120 || (courseName !== null && courseName.length > 160)) {
      return NextResponse.json({ error: "title est requis" }, { status: 400 });
    }

    const session = await fieldSessionService.create({ title, courseName: courseName || null, supervisorId: sessionUserId });

    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erreur POST /api/field-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
