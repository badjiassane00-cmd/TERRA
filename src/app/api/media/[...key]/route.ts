import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { readStoredImage } from "@/server/media/object-storage";
import { getSessionUserId } from "@/lib/session";
import { mediaAccessRepository } from "@/server/media/media-access.repository";
async function GETImpl(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!/^(?:avatars|observations)\/[0-9a-f-]{36}\.(?:jpg|png|webp|mp4|webm|mov)$/.test(key)) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  let publicMedia = key.startsWith("avatars/");
  if (key.startsWith("observations/")) {
    const viewerId = await getSessionUserId();
    const access = await mediaAccessRepository.getObservationMediaAccess(`/api/media/${key}`, viewerId);
    if (!access.allowed) return NextResponse.json({ error: viewerId ? "Média introuvable." : "Connexion requise." }, { status: viewerId ? 404 : 401, headers: { "Cache-Control": "no-store" } });
    publicMedia = access.public;
  }
  try {
    const image = await readStoredImage(key);
    if (!image) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    return new Response(image.body, { headers: { "Content-Type": image.contentType, ...(image.contentLength ? { "Content-Length": String(image.contentLength) } : {}), "Cache-Control": publicMedia ? "public, max-age=31536000, immutable" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    console.error("Erreur de lecture du média:", error);
    return NextResponse.json({ error: "Média indisponible." }, { status: 503 });
  }
}


export const GET = withApiErrors(GETImpl);
