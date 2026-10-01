import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { catalogueRepository } from "@/server/catalogues/catalogue.repository";
import { getSessionUserId } from "@/lib/session";
import { ORGANISM_GROUPS } from "@/types/nature";
async function POSTImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const catalog = await catalogueRepository.findOwned(id, userId);
  if (!catalog) return NextResponse.json({ error: "Catalogue introuvable." }, { status: 404 });
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) || "Entrée sans nom" : "Entrée sans nom";
  const group = ORGANISM_GROUPS.includes(body.group) ? body.group : "PLANT";
  const entry = await catalogueRepository.createEntry({ catalogId: id, name, group, scientificName: typeof body.scientificName === "string" ? body.scientificName.trim().slice(0, 160) || null : null, imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim().slice(0, 2048) || null : null, videoUrl: typeof body.videoUrl === "string" ? body.videoUrl.trim().slice(0, 2048) || null : null, note: typeof body.note === "string" ? body.note.trim().slice(0, 1000) || null : null });
  return NextResponse.json({ entry }, { status: 201 });
}


export const POST = withApiErrors(POSTImpl);
