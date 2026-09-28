import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

type PublicObservation = {
  id: string; sourceUrl: string; plantName: string; scientificName: string; organismGroup: OrganismGroup;
  imageUrl: string; photoAttribution: string; photoLicense: string | null; region: string;
  description: string | null; observedAt: string | null; createdAt: string; latitude: number | null;
  longitude: number | null; qualityGrade: string; comments: number; observer: string;
};

export default function ExternalObservationDetail({ observation }: { observation: PublicObservation }) {
  const date = observation.observedAt || observation.createdAt;
  return <main className="observation-detail-page">
    <nav className="observation-detail-topbar"><Link href="/observations"><ArrowLeft size={16} /> Toutes les observations</Link><Link href="/" className="observation-detail-brand"><span>✳</span> SunuNature</Link></nav>
    <div className="observation-detail-breadcrumb"><Link href="/">Accueil</Link><span>/</span><Link href="/observations">Observations</Link><span>/</span><span>iNaturalist #{observation.id}</span></div>
    <section className="observation-detail-hero">
      <div className="observation-detail-image-wrap">{observation.imageUrl ? <img className="observation-detail-image" src={observation.imageUrl} alt={observation.plantName} /> : <div className="observation-image-placeholder">Photographie non disponible</div>}<span className="observation-detail-image-tag">OBSERVATION iNATURALIST</span></div>
      <aside className="observation-taxon-card"><span className="observation-overline"><span /> {ORGANISM_LABELS[observation.organismGroup].toLocaleUpperCase("fr")}</span><h1>{observation.plantName}</h1>{observation.scientificName && <p className="observation-taxon-scientific">{observation.scientificName}</p>}<span className="observation-identification-status confirmed"><ShieldCheck size={16} /> Qualité : {observation.qualityGrade === "research" ? "recherche" : observation.qualityGrade}</span><div className="observation-author"><span className="observation-author-avatar"><UserRound size={17} /></span><span><small>OBSERVÉ PAR</small><strong>{observation.observer}</strong><small>Communauté iNaturalist</small></span></div><div className="observation-taxon-stats"><span><MessageCircle size={15} /> {observation.comments} commentaires</span></div><p className="observation-photo-credit">Photo : {observation.photoAttribution}{observation.photoLicense ? ` · Licence ${observation.photoLicense}` : " · Licence non précisée par la source"}</p><a className="external-observation-link" href={observation.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la fiche iNaturalist <ExternalLink size={15} /></a></aside>
    </section>
    <div className="observation-detail-columns"><div className="observation-detail-main"><section className="observation-info-card"><div className="observation-card-title"><span className="observation-icon-tile"><MapPin size={17} /></span><div><small>RENCONTRE DE TERRAIN</small><h2>À propos de cette observation</h2></div></div><p className="observation-full-description">{observation.description || "Cette observation a été partagée publiquement sur iNaturalist."}</p><div className="observation-facts-grid"><div><MapPin size={16} /><span><small>LIEU INDIQUÉ</small><strong>{observation.region}</strong></span></div><div><CalendarDays size={16} /><span><small>DATE D’OBSERVATION</small><strong>{new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong></span></div></div><p className="observation-location-privacy">Les données et les interactions de cette fiche sont hébergées par iNaturalist. Suivez le lien source pour commenter ou proposer une identification.</p></section></div><aside className="observation-detail-sidebar"><section className="observation-contribute-card"><span className="observation-side-decoration">✳</span><small>CONTRIBUER AU CARNET</small><h2>Vous avez croisé une espèce ?</h2><p>Partagez une rencontre depuis le terrain avec la communauté SunuNature.</p><Link href="/connexion">Ajouter une observation <ExternalLink size={14} /></Link></section></aside></div>
  </main>;
}
