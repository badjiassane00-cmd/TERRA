import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

const MAX_IMAGE_BYTES = 320_000;
const MAX_REQUEST_LENGTH = 460_000;
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

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
  if (typeof avatarUrl === "string") {
    const match = IMAGE_DATA_URL.exec(avatarUrl);
    if (!match) return NextResponse.json({ error: "Utilisez une image JPEG, PNG ou WebP." }, { status: 400 });
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "La photo doit faire moins de 320 Ko." }, { status: 413 });
    }
    const type = match[1];
    const validSignature = type === "jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : type === "png"
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!validSignature) return NextResponse.json({ error: "Le fichier image semble endommagé." }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl }, select: { id: true, avatarUrl: true } });
  return NextResponse.json({ avatarUrl: user.avatarUrl });
}
