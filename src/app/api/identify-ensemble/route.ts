import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { identificationRepository } from "@/server/identification/identification.repository";
import { identificationService } from "@/server/identification/identification.service";
async function POSTImpl(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) return NextResponse.json({ error: "Utilisez une image JPEG, PNG ou WebP." }, { status: 415 });
    if (image.size > 10 * 1024 * 1024) return NextResponse.json({ error: "L’image ne doit pas dépasser 10 Mo." }, { status: 413 });
    const result = await identificationService.identify(image);
    const userId = await getSessionUserId();
    const top = result.candidates[0];
    if (top && userId) {
      await identificationRepository.saveCandidates(userId, top.scientificName, top.name, typeof top.enrichedData?.description === "string" ? top.enrichedData.description : `Identifié via ${top.source}`, JSON.stringify({ candidates: result.candidates, source: result.source }));
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur identification ensemble:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur lors de l'identification" }, { status: 502 });
  }
}


export const POST = withApiErrors(POSTImpl);
