import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { readStoredImage } from "@/server/media/object-storage";
async function GETImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await params;
  const asset = await prisma.mediaAsset.findFirst({ where: { id, userId }, select: { objectKey: true, contentType: true } });
  if (!asset) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  try {
    const image = await readStoredImage(asset.objectKey);
    if (!image) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    return new Response(image.body, { headers: { "Content-Type": asset.contentType, ...(image.contentLength ? { "Content-Length": String(image.contentLength) } : {}), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("Erreur de lecture du média personnel:", error);
    return NextResponse.json({ error: "Média indisponible." }, { status: 503 });
  }
}


export const GET = withApiErrors(GETImpl);
