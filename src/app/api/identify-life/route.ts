import { getSessionUserId } from "@/lib/session";
import { identificationRepository } from "@/server/identification/identification.repository";
import { bioClipIdentificationAdapter } from "@/server/identification/bioclip.adapter";
import { geminiIdentificationAdapter, type GeminiLifeGroup } from "@/server/identification/gemini.adapter";
import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function POSTImpl(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const groupValue = formData.get("group");
  const allowedGroups: GeminiLifeGroup[] = ["plants", "insects", "animals", "fish", "all"];
  const group: GeminiLifeGroup = typeof groupValue === "string" && allowedGroups.includes(groupValue as GeminiLifeGroup)
    ? groupValue as GeminiLifeGroup
    : "all";

  if (!(image instanceof File)) throw new ApiError("Prenez ou choisissez une photo nette du vivant.", 400);
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new ApiError("Utilisez une image JPEG, PNG ou WebP.", 415);
  if (image.size > 10 * 1024 * 1024) throw new ApiError("L’image ne doit pas dépasser 10 Mo.", 413);

  const provider = process.env.GEMINI_API_KEY ? "Gemini" : "BioCLIP";
  const identified = process.env.GEMINI_API_KEY
    ? await geminiIdentificationAdapter.identify(image, group)
    : await bioClipIdentificationAdapter.identify(image, group === "insects" ? "insects" : group === "all" ? "all" : "animals");
  if (!identified.length) throw new ApiError(`${provider} n’a pas trouvé de piste dans ce groupe. Essayez une photo plus nette ou un autre type de vivant.`, 422);

  const candidates = identified.map((candidate) => ({
    scientific_name: candidate.scientific_name,
    common_names: candidate.common_name ? [candidate.common_name] : [candidate.scientific_name],
    probability: candidate.probability,
    taxonomy: candidate.taxonomy,
    description: `Suggestion visuelle ${provider} à confirmer par la communauté naturaliste.`,
  }));
  const result = candidates[0];
  const userId = await getSessionUserId();
  if (userId && result) {
    await identificationRepository.saveCandidates(
      userId,
      result.scientific_name,
      result.common_names[0],
      result.description,
      JSON.stringify({ provider, group, candidates }),
    );
  }

  return NextResponse.json({
    provider,
    result: result ? {
      id: result.scientific_name,
      scientific_name: result.scientific_name,
      common_names: result.common_names,
      probability: result.probability,
      description: result.description,
      taxonomy: result.taxonomy,
      sources: { provider: provider === "Gemini" ? "Gemini · Google" : "BioCLIP · Imageomics" },
    } : null,
    candidates,
    note: `Identification assistée à vérifier sur le terrain; modèle utilisé : ${provider}.`,
  });
}

export const POST = withApiErrors(POSTImpl);
