import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isStorageConfigured, storePublicImage } from "@/server/media/object-storage";

const MAX_REQUEST_LENGTH = 460_000;

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour modifier votre photo." }, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_REQUEST_LENGTH) return NextResponse.json({ error: "La photo dépasse la taille autorisée." }, { status: 413 });

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("avatarUrl" in body)) {
    return NextResponse.json({ error: "Photo manquante." }, { status: 400 });
  }

  const avatarUrl = (body as { avatarUrl: unknown }).avatarUrl;
  if (avatarUrl !== null && typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "Format de photo invalide." }, { status: 400 });
  }
  let storedAvatarUrl: string | null = null;
  if (typeof avatarUrl === "string") {
    if (!avatarUrl.startsWith("data:image/")) return NextResponse.json({ error: "Envoyez une image JPEG, PNG ou WebP." }, { status: 400 });
    if (!isStorageConfigured()) return NextResponse.json({ error: "Le stockage photo n’est pas encore configuré." }, { status: 503 });
    try { storedAvatarUrl = await storePublicImage(avatarUrl, "avatars"); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Image invalide." }, { status: 400 }); }
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl: storedAvatarUrl }, select: { id: true, avatarUrl: true } });
  return NextResponse.json({ avatarUrl: user.avatarUrl });
}
