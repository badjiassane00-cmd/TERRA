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

async function attemptGemini(image: File, group: GeminiLifeGroup): Promise<GeminiAttempt> {
  try {
    return { candidates: await geminiIdentificationAdapter.identify(image, group) };
  } catch (error) {
    return { error };
  }
}

function bioClipIsConfigured() {
  return Boolean(process.env.BIOCLIP_API_URL || process.env.BIOCLIP_URL);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "erreur inconnue";
}

export async function identifyLifeSpecies(image: File, group: GeminiLifeGroup) {
  if (!process.env.GEMINI_API_KEY) {
    const candidates = await bioClipIdentificationAdapter.identify(image, group as BioClipGroup);
    return { provider: "BioCLIP" as const, candidates };
  }

  const attempt = await attemptGemini(image, group);
  if ("candidates" in attempt && attempt.candidates.length > 0) {
    return { provider: "Gemini" as const, candidates: attempt.candidates };
  }
  if (!bioClipIsConfigured()) {
    if ("error" in attempt) throw attempt.error;
    return { provider: "Gemini" as const, candidates: attempt.candidates };
  }

  try {
    const candidates = await bioClipIdentificationAdapter.identify(image, group as BioClipGroup);
    return { provider: "BioCLIP" as const, candidates };
  } catch (fallbackError) {
    if ("error" in attempt) {
      throw new ApiError(
        `Gemini a échoué (${errorMessage(attempt.error)}) et BioCLIP est indisponible (${errorMessage(fallbackError)}).`,
        503,
      );
    }
    throw fallbackError;
  }
}