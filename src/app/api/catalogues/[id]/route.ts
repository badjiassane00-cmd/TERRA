import { getSessionUserId } from "@/lib/session";
import { withApiErrors } from "@/server/http/api-handler";
import { catalogueRepository } from "@/server/catalogues/catalogue.repository";
import { NextResponse } from "next/server";

async function PATCHImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) || "Catalogue sans titre" : undefined;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : body.description === null ? null : undefined;
  const result = await catalogueRepository.updateOwned(id, userId, { ...(title !== undefined ? { title } : {}), ...(description !== undefined ? { description } : {}) });
  if (!result.count) return NextResponse.json({ error: "Catalogue introuvable." }, { status: 404 });
  return NextResponse.json({ success: true });
}

async function DELETEImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const result = await catalogueRepository.deleteOwned(id, userId);
  if (!result.count) return NextResponse.json({ error: "Catalogue introuvable." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export const PATCH = withApiErrors(PATCHImpl);
export const DELETE = withApiErrors(DELETEImpl);
