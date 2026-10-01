import type { IdentificationCandidate, IdentificationStrategy } from "./identification.strategy";
import { KindwiseInsectIdentificationAdapter } from "./kindwise-insect.adapter";
import { PlantNetIdentificationAdapter } from "./plantnet.adapter";

/** Provider registry: callers select a domain strategy without depending on vendor details. */
const providers: Record<"plants" | "insects", IdentificationStrategy> = {
  plants: new PlantNetIdentificationAdapter(),
  insects: new KindwiseInsectIdentificationAdapter(),
};

export const identificationService = {
  async identify(image: File, domain: "plants" | "insects" = "plants"): Promise<{ source: string; candidates: IdentificationCandidate[]; totalCandidates: number }> {
    const strategy = providers[domain];
    const allCandidates = await strategy.identify(image);
    return { source: strategy.name, candidates: allCandidates.slice(0, 5), totalCandidates: allCandidates.length };
  },
};
