import { ApiError } from "@/server/http/api-handler";

export type BioClipGroup = "insects" | "animals" | "all";
export interface BioClipCandidate {
  scientific_name: string;
  common_name: string;
  probability: number;
  taxonomy: Record<string, string>;
}

interface BioClipResponse {
  candidates?: BioClipCandidate[];
}

/** Server-side adapter to the self-hosted BioCLIP inference service. */
export const bioClipIdentificationAdapter = {
  async identify(image: File, group: BioClipGroup): Promise<BioClipCandidate[]> {
    const baseUrl = process.env.BIOCLIP_API_URL || process.env.BIOCLIP_URL;
    if (!baseUrl) {
      throw new ApiError("BioCLIP n’est pas configuré. Démarrez le service BioCLIP et renseignez BIOCLIP_API_URL.", 503);
    }

    const form = new FormData();
    form.set("image", image, image.name || "observation.jpg");
    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, "")}/identify?group=${group}`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      throw new ApiError("Le service BioCLIP est injoignable. Vérifiez qu’il est démarré et réessayez.", 503);
    }

    const payload = await response.json().catch(() => null) as (BioClipResponse & { detail?: string }) | null;
    if (!response.ok) {
      throw new ApiError(payload?.detail || "Le service BioCLIP n’a pas pu analyser cette image.", response.status >= 500 ? 503 : response.status);
    }
    return Array.isArray(payload?.candidates) ? payload.candidates.slice(0, 5) : [];
  },
};
