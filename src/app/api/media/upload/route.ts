import { getSessionUserId } from "@/lib/session";
import { isImageDataUrl, isStorageConfigured, storePublicImage, storePublicVideo } from "@/server/media/object-storage";
import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function POSTImpl(request: Request) {
  if (!await getSessionUserId()) return NextResponse.json({ error: "Connectez-vous pour téléverser un média." }, { status: 401 });
  if (!isStorageConfigured()) return NextResponse.json({ error: "Le stockage média n’est pas configuré." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choisissez une photo ou une vidéo." }, { status: 400 });
  try {
    if (file.type.startsWith("video/")) {
      const videoUrl = await storePublicVideo(file);
      return NextResponse.json({ videoUrl, mediaType: "video" }, { status: 201 });
    }
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "La photo doit être JPEG, PNG ou WebP et faire moins de 8 Mo." }, { status: 415 });
    const imageData = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    if (!isImageDataUrl(imageData)) return NextResponse.json({ error: "Format de photo non pris en charge." }, { status: 415 });
    const imageUrl = await storePublicImage(imageData, "observations");
    return NextResponse.json({ imageUrl, mediaType: "image" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Téléversement vidéo impossible." }, { status: 400 });
  }
}

export const POST = withApiErrors(POSTImpl);
