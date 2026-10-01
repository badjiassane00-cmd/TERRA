import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { catalogueRepository } from "@/server/catalogues/catalogue.repository";
import { getSessionUserId } from "@/lib/session";
async function GETImpl() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const catalogs = await catalogueRepository.listForUser(userId);
  return NextResponse.json({ catalogs });
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) || "Catalogue sans titre" : "Catalogue sans titre";
  const catalog = await catalogueRepository.create({ userId, title, description: typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : null, isPublic: Boolean(body.isPublic) });
  return NextResponse.json({ catalog }, { status: 201 });
}


export const POST = withApiErrors(POSTImpl);
