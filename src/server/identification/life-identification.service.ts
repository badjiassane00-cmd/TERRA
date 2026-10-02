import { ApiError } from "@/server/http/api-handler";
import { bioClipIdentificationAdapter, type BioClipGroup } from "@/server/identification/bioclip.adapter";
import { geminiIdentificationAdapter, type GeminiLifeGroup } from "@/server/identification/gemini.adapter";

interface LifeCandidate {
  scientific_name: string;
  common_name: string;
  probability: number;
  taxonomy: Record<string, string>;
}

type GeminiAttempt = { candidates: LifeCandidate[] } | { error: unknown };
type BioClipAttempt = Awaited<ReturnType<typeof bioClipIdentificationAdapter.identify>> | { error: unknown };

async function attemptGemini(image: File, group: GeminiLifeGroup): Promise<GeminiAttempt> {
  try {
    return { candidates: await geminiIdentificationAdapter.identify(image, group) };
  } catch (error) {
    return { error };
  }
}

async function attemptBioClip(image: File, group: GeminiLifeGroup): Promise<BioClipAttempt> {
  try {
    return await bioClipIdentificationAdapter.identify(image, group as BioClipGroup);
  } catch (error) {
    return { error };
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "erreur inconnue";
}

export async function identifyLifeSpecies(image: File, group: GeminiLifeGroup) {
  // TERRA's own open model is the primary provider; Gemini is the fallback.
  const bioClipAttempt = await attemptBioClip(image, group);
  if (!("error" in bioClipAttempt) && bioClipAttempt.candidates.length > 0) {
    return bioClipAttempt;
  }

  const geminiAttempt = await attemptGemini(image, group);
  if ("candidates" in geminiAttempt && geminiAttempt.candidates.length > 0) {
    return { provider: "Gemini" as const, candidates: geminiAttempt.candidates };
  }
  if ("error" in geminiAttempt) {
    if ("error" in bioClipAttempt) {
      throw new ApiError(
        `BioCLIP a échoué (${errorMessage(bioClipAttempt.error)}) et Gemini est indisponible (${errorMessage(geminiAttempt.error)}).`,
        503,
      );
    }
    throw geminiAttempt.error;
  }

  if ("error" in bioClipAttempt) {
    throw new ApiError(`BioCLIP est indisponible (${errorMessage(bioClipAttempt.error)}) et Gemini n’a trouvé aucune piste.`, 503);
  }

  return { provider: "Gemini" as const, candidates: geminiAttempt.candidates };
}
