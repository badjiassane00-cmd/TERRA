import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { exhibitionService } from "@/server/exhibitions/exhibition.service";
import { getSessionUserId } from "../../../../../lib/session";
async function POSTImpl(
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
    const { plantId, scientificName, commonName, imageUrl, videoUrl, note } = body;
    if (!plantId && !scientificName && !imageUrl && !videoUrl) return NextResponse.json({ error: "Ajoutez une espèce ou un média." }, { status: 400 });

    const result = await exhibitionService.addPlant(id, sessionUserId, {
      plantId: typeof plantId === "string" ? plantId : undefined,
      scientificName: typeof scientificName === "string" && scientificName.trim() ? scientificName.trim() : (!plantId ? `Media-${crypto.randomUUID()}` : undefined),
      commonName: typeof commonName === "string" ? commonName : (!plantId && !scientificName ? "Média partagé" : undefined),
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
      videoUrl: typeof videoUrl === "string" ? videoUrl : null,
      note: typeof note === "string" ? note : null,
    });
    if (result.kind === "missing") return NextResponse.json({ error: "Exposition introuvable" }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const item = result.item;

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Erreur POST /api/my-exhibitions/[id]/items:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const POST = withApiErrors(POSTImpl);
