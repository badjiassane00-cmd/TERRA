import { getSessionUserId } from "@/lib/session";
import { identificationRepository } from "@/server/identification/identification.repository";
import { bioClipIdentificationAdapter } from "@/server/identification/bioclip.adapter";
import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError("Connectez-vous pour enregistrer une identification d’insecte.", 401);
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) throw new ApiError("Ajoutez une photo d’insecte.", 400);
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new ApiError("Utilisez une image JPEG, PNG ou WebP.", 415);
  if (image.size > 10 * 1024 * 1024) throw new ApiError("L’image ne doit pas dépasser 10 Mo.", 413);

  const identified = await bioClipIdentificationAdapter.identify(image, "insects");
  if (!identified.length) throw new ApiError("BioCLIP n’a pas trouvé d’insecte dans cette image. Essayez un cadrage plus rapproché.", 422);
  const candidates = identified.map((candidate) => ({
    scientific_name: candidate.scientific_name,
    common_names: candidate.common_name ? [candidate.common_name] : [candidate.scientific_name],
    probability: candidate.probability,
    taxonomy: candidate.taxonomy,
    description: "Suggestion visuelle BioCLIP à confirmer par la communauté naturaliste.",
  }));
  const result = candidates[0];
  await identificationRepository.saveCandidates(
    userId,
    result.scientific_name,
    result.common_names[0],
    result.description,
    JSON.stringify({ provider: "BioCLIP", group: "insects", candidates }),
  );

  return NextResponse.json({
    provider: "BioCLIP",
    result: { ...result, id: result.scientific_name, sources: { provider: "BioCLIP · Imageomics" } },
    candidates,
    note: "Identification assistée à vérifier sur le terrain; la photo est analysée par le service BioCLIP hébergé par TERRA.",
  });
}

export const POST = withApiErrors(POSTImpl);
