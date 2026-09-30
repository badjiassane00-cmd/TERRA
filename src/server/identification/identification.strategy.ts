export type IdentificationCandidate = { name: string; scientificName: string; source: string; confidence: number; enrichedData?: Record<string, unknown> };
export interface IdentificationStrategy {
  readonly name: string;
  identify(image: File): Promise<IdentificationCandidate[]>;
}
