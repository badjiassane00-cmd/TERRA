import { getSessionUserId } from "@/lib/session";
import { isImageDataUrl, isStorageConfigured, storePublicImage, storePublicVideo } from "@/server/media/object-storage";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedFormData } from "@/server/http/read-limited-form-data";
import { mediaRepository } from "@/server/media/media.repository";
import { storePrivateImage } from "@/server/media/object-storage";

export const runtime = "nodejs";

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour téléverser un média." }, { status: 401 });
  const limited = await enforceRateLimit(request, "media-upload", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  if (!isStorageConfigured()) return NextResponse.json({ error: "Le stockage média n’est pas configuré." }, { status: 503 });
  const form = await readLimitedFormData(request, 36 * 1024 * 1024);
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choisissez une photo ou une vidéo." }, { status: 400 });
  const visibility = form.get("visibility") === "private" ? "private" : "public";
  try {
    if (file.type.startsWith("video/")) {
      if (visibility === "private") return NextResponse.json({ error: "Le stockage privé ne prend pas encore en charge les vidéos." }, { status: 415 });
      const videoUrl = await storePublicVideo(file);
      return NextResponse.json({ videoUrl, mediaType: "video" }, { status: 201 });
    }
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "La photo doit être JPEG, PNG ou WebP et faire moins de 8 Mo." }, { status: 415 });
    const imageData = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    if (!isImageDataUrl(imageData)) return NextResponse.json({ error: "Format de photo non pris en charge." }, { status: 415 });
    if (visibility === "private") {
      const asset = await storePrivateImage(imageData);
      const record = await mediaRepository.createOwnedAsset(userId, asset.key, asset.mime);
      return NextResponse.json({ imageUrl: `/api/media/private/${record.id}`, mediaType: "image", visibility }, { status: 201 });
    }
    const imageUrl = await storePublicImage(imageData, "observations");
    return NextResponse.json({ imageUrl, mediaType: "image", visibility }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Téléversement vidéo impossible." }, { status: 400 });
  }
}

export const POST = withApiErrors(POSTImpl);
