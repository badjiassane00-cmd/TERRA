import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Leaf } from "lucide-react";
import { observationRepository } from "@/server/observations/observation.repository";

export const metadata: Metadata = {
  title: "Identification partagée — TERRA",
  description: "Une piste d’identification naturaliste partagée sur TERRA.",
};

export default async function SharedIdentificationPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const identification = await observationRepository.findPublicIdentification(id);
  if (!identification || identification.identificationProbability === null) notFound();

  return (
    <main className="observation-detail-page">
      <nav className="observation-detail-topbar">
        <Link href="/identifier" className="herbarium-button"><ArrowLeft size={16} /> Nouvelle identification</Link>
        <Link href="/" className="observation-detail-brand"><span>✳</span> TERRA</Link>
      </nav>
      <article className="observation-info-card mx-auto max-w-3xl">
        <div className="observation-card-title">
          <span className="observation-icon-tile"><Leaf size={17} /></span>
          <div><small>FICHE PARTAGÉE</small><h1>{identification.plantName}</h1></div>
        </div>
        {identification.imageUrl && (
          <Image
            src={identification.imageUrl}
            alt={identification.plantName}
            width={1280}
            height={900}
            unoptimized
            className="mt-5 max-h-[65vh] w-full rounded-lg border border-border object-contain"
          />
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="italic text-foreground/70">{identification.scientificName}</p>
          <span className="observation-identification-status pending"><BadgeCheck size={16} /> Piste à confirmer</span>
        </div>
        <div className="observation-facts-grid mt-5">
          <div><Leaf size={16} /><span><small>SCORE ESTIMÉ</small><strong>{Math.round(identification.identificationProbability * 100)} %</strong></span></div>
          <div><BadgeCheck size={16} /><span><small>PROPOSÉ PAR</small><strong>TERRA · reconnaissance visuelle</strong></span></div>
        </div>
        <p className="observation-location-privacy mt-5">Cette identification automatique est une piste visuelle, pas une confirmation scientifique. Aucun profil ni lieu d’observation n’est associé à cette fiche.</p>
      </article>
    </main>
  );
}
