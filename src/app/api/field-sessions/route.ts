import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";
import { getSessionUserId } from "../../../lib/session";

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

    const body = await request.json();
    const { title, courseName } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title est requis" }, { status: 400 });
    }

    const session = await fieldSessionService.create({ title, courseName, supervisorId: sessionUserId });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur POST /api/field-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
