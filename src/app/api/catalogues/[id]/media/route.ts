import { getSessionUserId } from "@/lib/session";
import { withApiErrors } from "@/server/http/api-handler";
import { catalogueRepository } from "@/server/catalogues/catalogue.repository";
import { NextResponse } from "next/server";

async function POSTImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id: catalogId } = await params;
  if (!await catalogueRepository.findOwned(catalogId, userId)) return NextResponse.json({ error: "Catalogue introuvable." }, { status: 404 });
  const body = await request.json();
  const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim().slice(0, 2048) : "";
  const mediaType = body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : "";
  if (!mediaType || (!/^https:\/\//i.test(mediaUrl) && !/^\/api\/media\/(?:avatars|observations)\/[\w-]+\.(?:jpg|png|webp|mp4|webm|mov)$/i.test(mediaUrl))) {
    return NextResponse.json({ error: "Média ou format non valide." }, { status: 400 });
  }
  const media = await catalogueRepository.addMedia({ catalogId, mediaUrl, mediaType });
  return NextResponse.json({ media }, { status: 201 });
}

export const POST = withApiErrors(POSTImpl);
