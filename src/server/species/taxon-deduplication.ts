export type TaxonUsageIdentity = { key: number; nubKey?: number | null };

/** Keep the first GBIF usage for each canonical backbone taxon. */
export function deduplicateTaxonUsages<T extends TaxonUsageIdentity>(usages: readonly T[]): T[] {
  const seen = new Set<number>();
  return usages.filter((usage) => {
    const canonicalKey = usage.nubKey || usage.key;
    if (seen.has(canonicalKey)) return false;
    seen.add(canonicalKey);
    return true;
  });
}
