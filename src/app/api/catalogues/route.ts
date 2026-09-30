import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
async function GETImpl() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const catalogs = await prisma.natureCatalog.findMany({ where: { userId }, include: { _count: { select: { entries: true } }, entries: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ catalogs });
}



export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
  if (!title) return NextResponse.json({ error: "Donnez un nom au catalogue." }, { status: 400 });
  const catalog = await prisma.natureCatalog.create({ data: { userId, title, description: typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : null, isPublic: Boolean(body.isPublic) } });
  return NextResponse.json({ catalog }, { status: 201 });
}


export const POST = withApiErrors(POSTImpl);
