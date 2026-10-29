import type { Metadata } from "next";
import SpeciesExplorer from "@/components/species/SpeciesExplorer";
import { gbifSpeciesService } from "@/server/species/gbif.service";

export const metadata: Metadata = {
  title: "Explorer la biodiversité — TERRA",
  description: "Recherche mondiale d’espèces et de taxons appuyée sur le backbone taxonomique GBIF, avec références et crédits documentés.",
};

export default async function BiodiversityPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; kingdom?: string | string[]; rank?: string | string[]; habitat?: string | string[]; threatStatus?: string | string[] }> }) {
  const params = await searchParams;
  const first = (value?: string | string[]) => Array.isArray(value) ? value[0] || "" : value || "";
  const initialQuery = first(params.q);
  const initialKingdom = first(params.kingdom);
  const initialRank = first(params.rank);
  const initialHabitat = first(params.habitat);
  const initialThreatStatus = first(params.threatStatus);
  const hasActiveSearch = initialQuery.trim().length >= 2 || Boolean(initialKingdom || initialRank || initialHabitat || initialThreatStatus);
  const featuredPage = hasActiveSearch ? { results: [], nextOffset: 0, endOfRecords: true } : await gbifSpeciesService.featured();
  return <SpeciesExplorer initialQuery={initialQuery} initialKingdom={initialKingdom} initialRank={initialRank} initialHabitat={initialHabitat} initialThreatStatus={initialThreatStatus} featuredPage={featuredPage} />;
}
