import { getSessionUserId } from "@/lib/session";
import { identificationRepository } from "@/server/identification/identification.repository";
import { identificationService } from "@/server/identification/identification.service";
import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError("Connectez-vous pour utiliser la reconnaissance spécialisée des insectes.", 401);
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) throw new ApiError("Ajoutez une photo d’insecte.", 400);
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new ApiError("Utilisez une image JPEG, PNG ou WebP.", 415);
  if (image.size > 10 * 1024 * 1024) throw new ApiError("L’image ne doit pas dépasser 10 Mo.", 413);

  const identified = await identificationService.identify(image, "insects");
  const candidates = identified.candidates.map((candidate) => {
    const details = candidate.enrichedData || {};
    const taxonomy = details.taxonomy && typeof details.taxonomy === "object" ? details.taxonomy as Record<string, unknown> : {};
    const commonNames = Array.isArray(details.common_names)
      ? details.common_names.filter((name): name is string => typeof name === "string").slice(0, 5)
      : [candidate.name];
    const gbifId = details.gbif_id;
    return {
      scientific_name: candidate.scientificName,
      common_names: commonNames.length ? commonNames : [candidate.scientificName],
      probability: candidate.confidence,
      taxonomy,
      description: typeof details.description === "string" ? details.description : undefined,
      gbif: typeof gbifId === "number" || typeof gbifId === "string" ? `https://www.gbif.org/species/${gbifId}` : undefined,
    };
  });
  const result = candidates[0];
  if (result) {
    await identificationRepository.saveCandidates(
      userId,
      result.scientific_name,
      result.common_names[0],
      result.description || "Identification assistée par Kindwise Insect.id, à confirmer.",
      JSON.stringify({ candidates, source: identified.source }),
    );
  }

  return NextResponse.json({
    provider: identified.source,
    result: result ? {
      id: result.scientific_name,
      scientific_name: result.scientific_name,
      common_names: result.common_names,
      probability: result.probability,
      description: result.description,
      taxonomy: result.taxonomy,
      sources: { provider: identified.source, ...(result.gbif ? { gbif: result.gbif } : {}) },
    } : null,
    candidates,
  });
}

export const POST = withApiErrors(POSTImpl);
