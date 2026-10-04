import { getSessionUserId } from "@/lib/session";
import { identificationRepository } from "@/server/identification/identification.repository";
import { bioClipIdentificationAdapter } from "@/server/identification/bioclip.adapter";
import { geminiIdentificationAdapter } from "@/server/identification/gemini.adapter";
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

  let provider = "Gemini";
  let identified;
  if (process.env.GEMINI_API_KEY) {
    identified = await geminiIdentificationAdapter.identify(image, "insects");
  } else {
    const result = await bioClipIdentificationAdapter.identify(image, "insects");
    provider = result.provider;
    identified = result.candidates;
  }
  if (!identified.length) throw new ApiError(`${provider} n’a pas trouvé d’insecte dans cette image. Essayez un cadrage plus rapproché.`, 422);
  const candidates = identified.map((candidate) => ({
    scientific_name: candidate.scientific_name,
    common_names: candidate.common_name ? [candidate.common_name] : [candidate.scientific_name],
    probability: candidate.probability,
    taxonomy: candidate.taxonomy,
    description: `Suggestion visuelle ${provider} à confirmer par la communauté naturaliste.`,
  }));
  const result = candidates[0];
  let sourceProvider = "BioCLIP · Imageomics";
  if (provider === "Gemini") sourceProvider = "Gemini · Google";
  else if (provider === "BioCLIP + TERRA") sourceProvider = "BioCLIP · modèle TERRA";
  await identificationRepository.saveCandidates(
    userId,
    result.scientific_name,
    result.common_names[0],
    result.description,
    JSON.stringify({ provider, group: "insects", candidates }),
  );

  return NextResponse.json({
    provider,
    result: { ...result, id: result.scientific_name, sources: { provider: sourceProvider } },
    candidates,
    note: `Identification assistée à vérifier sur le terrain; modèle utilisé : ${provider}.`,
  });
}

export const POST = withApiErrors(POSTImpl);
