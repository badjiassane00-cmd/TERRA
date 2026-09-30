import type { IdentificationCandidate, IdentificationStrategy } from "./identification.strategy";

type PlantNetResult = { species?: { name?: string; scientificName?: string; enrichedData?: Record<string, unknown> }; score?: number };
type PlantNetResponse = { results?: PlantNetResult[] };

/** Adapter translates the PlantNet API contract into TERRA identification candidates. */
export class PlantNetIdentificationAdapter implements IdentificationStrategy {
  readonly name = "plantnet";
  async identify(image: File): Promise<IdentificationCandidate[]> {
    const apiKey = process.env.PLANTNET_API_KEY;
    if (!apiKey) throw new Error("Le fournisseur Pl@ntNet n’est pas configuré.");
    const form = new FormData();
    form.append("images", new Blob([await image.arrayBuffer()], { type: image.type }), image.name);
    form.append("organs", "auto");
    const response = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}`, { method: "POST", body: form, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Pl@ntNet a répondu avec le statut ${response.status}.`);
    const data = await response.json() as PlantNetResponse;
    return (data.results || []).map((result) => {
      const scientificName = result.species?.scientificName || result.species?.name || "Espèce inconnue";
      return { name: result.species?.name || scientificName, scientificName, source: this.name, confidence: result.score || 0, enrichedData: result.species?.enrichedData };
    }).sort((a, b) => b.confidence - a.confidence);
  }
}
