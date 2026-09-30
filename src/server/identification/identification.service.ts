import type { IdentificationCandidate, IdentificationStrategy } from "./identification.strategy";
import { PlantNetIdentificationAdapter } from "./plantnet.adapter";

/** Identification Strategy registry; providers can be exchanged without changing callers. */
const providers: IdentificationStrategy[] = [new PlantNetIdentificationAdapter()];
export const identificationService = {
  async identify(image: File): Promise<{ source: string; candidates: IdentificationCandidate[]; totalCandidates: number }> {
    const strategy = providers[0];
    const allCandidates = await strategy.identify(image);
    return { source: "ensemble", candidates: allCandidates.slice(0, 5), totalCandidates: allCandidates.length };
  },
};
