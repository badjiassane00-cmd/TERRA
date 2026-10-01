import { ApiError } from "@/server/http/api-handler";

export type GeminiLifeGroup = "plants" | "insects" | "animals" | "fish" | "all";

export interface GeminiSpeciesCandidate {
  scientific_name: string;
  common_name: string;
  probability: number;
  taxonomy: Record<string, string>;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

const GROUP_LABELS: Record<GeminiLifeGroup, string> = {
  plants: "plantes, arbres, mousses, champignons et autres organismes sessiles",
  insects: "insectes et autres invertébrés",
  animals: "animaux terrestres, oiseaux, reptiles, amphibiens et mammifères",
  fish: "poissons et autres animaux aquatiques",
  all: "tout être vivant : plantes, champignons, insectes, animaux terrestres et aquatiques",
};

/** Multimodal Gemini adapter. The API key is only read on the server. */
export const geminiIdentificationAdapter = {
  async identify(image: File, group: GeminiLifeGroup): Promise<GeminiSpeciesCandidate[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError("Gemini n’est pas configuré. Ajoutez GEMINI_API_KEY aux variables d’environnement du serveur.", 503);
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
    const prompt = `Tu es un assistant d'identification naturaliste prudent. Analyse cette photo pour trouver uniquement des espèces qui pourraient réellement être visibles. Groupe demandé : ${GROUP_LABELS[group]}. Si le groupe ne correspond pas clairement à l'image, retourne is_living=false. N'invente jamais une espèce, un nom local ou un détail absent de l'image. Fournis au maximum 5 hypothèses, de la plus plausible à la moins plausible. Les scores sont des estimations visuelles de 0 à 1, pas des probabilités scientifiques. Utilise le nom scientifique binomial quand il est défendable; sinon laisse scientific_name vide et donne le rang taxonomique fiable. Réponds dans la langue française pour les noms usuels et en JSON conforme au schéma.`;

    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: prompt },
            { inline_data: { mime_type: image.type, data: imageData } },
          ] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                is_living: { type: "BOOLEAN" },
                candidates: { type: "ARRAY", items: { type: "OBJECT", properties: {
                  scientific_name: { type: "STRING" },
                  common_name: { type: "STRING" },
                  confidence: { type: "NUMBER" },
                  taxonomy: { type: "OBJECT", properties: {
                    kingdom: { type: "STRING" }, phylum: { type: "STRING" }, class: { type: "STRING" },
                    order: { type: "STRING" }, family: { type: "STRING" }, genus: { type: "STRING" }, species: { type: "STRING" },
                  } },
                }, required: ["scientific_name", "common_name", "confidence", "taxonomy"] } },
              },
              required: ["is_living", "candidates"],
            },
            maxOutputTokens: 1200,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new ApiError("Gemini est temporairement injoignable. Réessayez dans un instant.", 503);
    }

    const payload = await response.json().catch(() => null) as GeminiResponse | null;
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "La clé Gemini est invalide ou n’a pas accès à ce modèle. Vérifiez GEMINI_API_KEY dans la configuration serveur."
        : response.status === 429
          ? "Le quota Gemini est atteint. Réessayez plus tard ou vérifiez les limites de votre clé Google AI Studio."
          : payload?.error?.message || "Gemini n’a pas pu analyser cette image.";
      throw new ApiError(message, response.status === 429 ? 429 : response.status >= 500 ? 503 : 502);
    }

    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) throw new ApiError("Gemini n’a pas retourné de résultat lisible. Essayez une autre photo.", 422);

    let parsed: { is_living?: boolean; candidates?: Array<{ scientific_name?: string; common_name?: string; confidence?: number; taxonomy?: Record<string, unknown> }> };
    try { parsed = JSON.parse(text); } catch { throw new ApiError("La réponse Gemini est illisible. Réessayez avec une autre photo.", 502); }
    if (!parsed.is_living || !Array.isArray(parsed.candidates)) return [];

    return parsed.candidates.slice(0, 5).flatMap((candidate) => {
      const commonName = candidate.common_name?.trim();
      const scientificName = candidate.scientific_name?.trim() || commonName;
      if (!scientificName) return [];
      const score = Number(candidate.confidence);
      const taxonomy = Object.fromEntries(Object.entries(candidate.taxonomy || {})
        .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0));
      return [{
        scientific_name: scientificName,
        common_name: commonName || scientificName || "Espèce à préciser",
        probability: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0.25,
        taxonomy,
      }];
    });
  },
};
