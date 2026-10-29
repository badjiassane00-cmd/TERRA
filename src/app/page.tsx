import type { Metadata } from "next";
import HomeLanding from "@/components/home/HomeLanding";
import { gbifSpeciesService } from "@/server/species/gbif.service";

export const metadata: Metadata = {
  title: "TERRA — Le vivant est partout. Découvrez-le.",
  description: "Explorez la biodiversité, identifiez les espèces qui vous entourent et retrouvez des sources naturalistes vérifiables.",
};

export default async function HomePage() {
  const featuredPage = await gbifSpeciesService.featured(0, 4);
  return <HomeLanding featuredSpecies={featuredPage.results.slice(0, 4)} />;
}
