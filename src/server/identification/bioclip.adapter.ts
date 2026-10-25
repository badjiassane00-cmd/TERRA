import { ApiError } from "@/server/http/api-handler";

export type BioClipGroup = "plants" | "insects" | "animals" | "fish" | "all";
export interface BioClipCandidate {
  scientific_name: string;
  common_name: string;
  probability: number;
  taxonomy: Record<string, string>;
}

export type BioClipProvider = "BioCLIP" | "BioCLIP + TERRA";

interface BioClipResponse {
  provider?: string;
  candidates?: BioClipCandidate[];
}

function bioClipHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = process.env.HF_TOKEN;
  const apiKey = process.env.BIOCLIP_API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["X-TERRA-API-KEY"] = apiKey;
  return headers;
}

async function identifyViaHuggingFaceSpace(
  baseUrl: string,
  image: File,
  group: BioClipGroup,
): Promise<{ provider: BioClipProvider; candidates: BioClipCandidate[] }> {
  if (!process.env.HF_TOKEN || !process.env.BIOCLIP_API_KEY) {
    throw new ApiError("BioCLIP ZeroGPU nécessite HF_TOKEN et BIOCLIP_API_KEY dans les variables du serveur.", 503);
  }

  try {
    const headers = bioClipHeaders();
    const upload = new FormData();
    upload.append("files", image, image.name || "observation.jpg");
    const uploaded = await fetch(`${baseUrl}/gradio_api/upload`, {
      method: "POST", headers, body: upload, signal: AbortSignal.timeout(90_000),
    });
    if (!uploaded.ok) throw new Error(`Upload refusé (${uploaded.status}).`);
    const [path] = await uploaded.json() as string[];
    if (!path) throw new Error("Hugging Face n’a pas retourné le fichier chargé.");

    const queued = await fetch(`${baseUrl}/gradio_api/call/identify`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ path, meta: { _type: "gradio.FileData" } }, group] }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!queued.ok) throw new Error(`Requête BioCLIP refusée (${queued.status}).`);
    const { event_id: eventId } = await queued.json() as { event_id?: string };
    if (!eventId) throw new Error("Hugging Face n’a pas retourné l’identifiant du calcul.");

    const result = await fetch(`${baseUrl}/gradio_api/call/identify/${encodeURIComponent(eventId)}`, {
      headers, signal: AbortSignal.timeout(120_000),
    });
    if (!result.ok || !result.body) throw new Error(`Résultat BioCLIP indisponible (${result.status}).`);
    const stream = await result.text();
    const complete = stream.split("\n\n").find((event) => event.startsWith("event: complete"));
    const dataLine = complete?.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) throw new Error("Le calcul BioCLIP n’a pas abouti.");
    const [payload] = JSON.parse(dataLine.slice(6)) as [BioClipResponse];
    return {
      provider: payload?.provider === "BioCLIP + TERRA" ? "BioCLIP + TERRA" : "BioCLIP",
      candidates: Array.isArray(payload?.candidates) ? payload.candidates.slice(0, 5) : [],
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : "Le Space BioCLIP n’a pas répondu.", 503);
  }
}

/** Server-side adapter to a BioCLIP HTTP service (self-hosted or a Gradio Space). */
export const bioClipIdentificationAdapter = {
  async identify(image: File, group: BioClipGroup): Promise<{ provider: BioClipProvider; candidates: BioClipCandidate[] }> {
    const configuredUrl = process.env.BIOCLIP_API_URL || process.env.BIOCLIP_URL;
    if (!configuredUrl) {
      throw new ApiError("BioCLIP n’est pas configuré. Démarrez le service BioCLIP et renseignez BIOCLIP_API_URL.", 503);
    }
    const baseUrl = /^https?:\/\//i.test(configuredUrl) ? configuredUrl : `http://${configuredUrl}`;

    if (baseUrl.includes("huggingface.co") || baseUrl.endsWith(".hf.space")) {
      return identifyViaHuggingFaceSpace(baseUrl.replace(/\/$/, ""), image, group);
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
    return {
      provider: payload?.provider === "BioCLIP + TERRA" ? "BioCLIP + TERRA" : "BioCLIP",
      candidates: Array.isArray(payload?.candidates) ? payload.candidates.slice(0, 5) : [],
    };
  },
};
