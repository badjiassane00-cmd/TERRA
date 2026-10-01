import { ApiError } from "@/server/http/api-handler";
import type { IdentificationCandidate, IdentificationStrategy } from "./identification.strategy";

type Suggestion = { name?: string; probability?: number; details?: Record<string, unknown> };
type ResponseBody = { result?: { classification?: { suggestions?: Suggestion[] } } };

/** Maps the Kindwise Insect.id contract into TERRA's provider-neutral candidates. */
export class KindwiseInsectIdentificationAdapter implements IdentificationStrategy {
  readonly name = "Kindwise Insect.id";

  async identify(image: File): Promise<IdentificationCandidate[]> {
    const apiKey = process.env.INSECT_API_KEY;
    if (!apiKey) throw new ApiError("La reconnaissance des insectes n’est pas configurée sur le serveur.", 503);

    const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const endpoint = new URL("https://insect.kindwise.com/api/v1/identification");
    endpoint.searchParams.set("details", "common_names,taxonomy,description,url,gbif_id");
    endpoint.searchParams.set("language", "fr");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": apiKey },
      body: JSON.stringify({ images: [imageBase64], similar_images: false }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new ApiError("La clé Insect.id est invalide ou son compte n’a plus de crédits.", 502);
      if (response.status === 429) throw new ApiError("Le quota de reconnaissance des insectes est temporairement dépassé.", 429);
      throw new ApiError("Le service de reconnaissance des insectes est momentanément indisponible.", 502);
    }

    const payload = await response.json() as ResponseBody;
    return (payload.result?.classification?.suggestions || []).slice(0, 5).flatMap((suggestion) => {
      const scientificName = suggestion.name?.trim();
      if (!scientificName) return [];
      const details = suggestion.details || {};
      const commonNames = Array.isArray(details.common_names)
        ? details.common_names.filter((name): name is string => typeof name === "string").slice(0, 5)
        : [];
      const confidence = typeof suggestion.probability === "number" ? Math.max(0, Math.min(1, suggestion.probability)) : 0;
      return [{ name: commonNames[0] || scientificName, scientificName, source: this.name, confidence, enrichedData: details }];
    });
  }
}
