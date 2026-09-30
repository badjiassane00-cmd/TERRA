import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { exhibitionService } from "@/server/exhibitions/exhibition.service";
import { getSessionUserId } from "../../../../lib/session";
async function GETImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exhibition = await exhibitionService.findById(id);;

    if (!exhibition) {
      return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    }

    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error("Erreur GET /api/my-exhibitions/[id]:", error);
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
    const { title, description, theme, isPublic, coverImage } = body;

    const result = await exhibitionService.updateOwned(id, sessionUserId, {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
    });
    if (result.kind === "missing") return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    return NextResponse.json({ exhibition: result.exhibition });
  } catch (error) {
    console.error("Erreur PATCH /api/my-exhibitions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const PATCH = withApiErrors(PATCHImpl);

async function DELETEImpl(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    const { id } = await params;
    const result = await exhibitionService.deleteOwned(id, sessionUserId);
    if (result === "missing") return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    if (result === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/my-exhibitions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const DELETE = withApiErrors(DELETEImpl);
