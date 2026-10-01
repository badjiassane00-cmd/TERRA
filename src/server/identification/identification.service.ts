import type { IdentificationCandidate, IdentificationStrategy } from "./identification.strategy";
import { PlantNetIdentificationAdapter } from "./plantnet.adapter";

/** Provider registry: callers select a domain strategy without depending on vendor details. */
const providers: Record<"plants", IdentificationStrategy> = {
  plants: new PlantNetIdentificationAdapter(),
};

export const identificationService = {
  async identify(image: File): Promise<{ source: string; candidates: IdentificationCandidate[]; totalCandidates: number }> {
    const strategy = providers.plants;
    const allCandidates = await strategy.identify(image);
    return { source: strategy.name, candidates: allCandidates.slice(0, 5), totalCandidates: allCandidates.length };
  },
};
