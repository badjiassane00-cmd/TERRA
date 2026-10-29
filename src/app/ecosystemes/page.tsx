import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, MapPinned, Sprout } from "lucide-react";
import NatureCompanion from "@/components/ecology/NatureCompanion";

export const metadata: Metadata = {
  title: "Écosystèmes et saisons — TERRA",
  description: "Explorez les rythmes saisonniers et les co-présences d’espèces à partir d’observations publiques.",
};

export default function EcosystemsPage() {
  return <main className="terra-ecosystems-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="ecosystems-title">
    <header className="mb-8 rounded-2xl border border-border bg-paper p-6 sm:p-9">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"><Sprout size={15} /> Terrain · écosystèmes</span>
      <h1 id="ecosystems-title" className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight text-foreground sm:text-5xl">Comprendre le vivant au fil des saisons.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/75 sm:text-base">Consultez les observations publiques partagées dans TERRA pour explorer les périodes de partage et les co-présences locales de plantes et d’insectes.</p>
      <p className="mt-3 max-w-3xl text-xs leading-6 text-foreground/70">Ces tendances décrivent les observations disponibles. Une co-présence ne prouve pas une interaction écologique et l’absence de signalements ne signifie pas l’absence d’une espèce.</p>
      <nav className="mt-6 flex flex-wrap gap-3" aria-label="Explorer les données du vivant">
        <Link className="herbarium-button herbarium-button-primary inline-flex items-center gap-2" href="/explorer?section=observations"><MapPinned size={16} /> Parcourir les observations <ArrowRight size={15} /></Link>
        <Link className="herbarium-button inline-flex items-center gap-2" href="/biodiversite"><BookOpen size={16} /> Ouvrir l’encyclopédie</Link>
      </nav>
    </header>
    <NatureCompanion />
  </main>;
}
