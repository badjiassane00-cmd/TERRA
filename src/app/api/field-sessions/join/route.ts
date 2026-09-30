import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { fieldSessionService } from "@/server/field-sessions/field-session.service";

// Un étudiant rejoint une session via le code communiqué à l'oral sur
// le terrain par l'encadrant.
async function POSTImpl(request: Request) {
  try {
    const body = await request.json();
    const code = (body.code || "").toString().trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const session = await fieldSessionService.join(code);

    if (!session || !session.active) {
      return NextResponse.json(
        { error: "Code invalide ou session terminée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur POST /api/field-sessions/join:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
