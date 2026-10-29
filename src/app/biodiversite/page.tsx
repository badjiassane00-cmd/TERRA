import type { Metadata } from "next";
import SpeciesExplorer from "@/components/species/SpeciesExplorer";

export const metadata: Metadata = {
  title: "Explorer la biodiversité — TERRA",
  description: "Recherche mondiale d’espèces et de taxons appuyée sur le backbone taxonomique GBIF, avec références et crédits documentés.",
};

export default async function BiodiversityPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const requested = params.q;
  const initialQuery = Array.isArray(requested) ? requested[0] || "" : requested || "";
  return <SpeciesExplorer initialQuery={initialQuery} />;
}
