"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BackLink from "@/components/navigation/BackLink";
import { ArrowLeft, BadgeCheck, CalendarDays, Check, Share2, Eye, Heart, LockKeyhole, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";
import { ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

interface ObservationComment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
  isDemo?: boolean;
}
interface ObservationIdentification {
  id: string;
  taxonName: string;
  createdAt: string;
  user: { id: string; name: string };
}
export interface ObservationDetailRecord {
  id: string;
  userId: string;
  plantName: string;
  scientificName: string;
  organismGroup: OrganismGroup;
  imageUrl: string;
  region: string;
  description: string | null;
  observedAt: string | null;
  createdAt: string;
  sourceUrl?: string | null;
  sourceObserver?: string | null;
  photoAttribution?: string | null;
  photoLicense?: string | null;
  isDemo?: boolean;
  latitude: number | null;
  longitude: number | null;
  locationVisibility: "PUBLIC" | "APPROXIMATE" | "PRIVATE";
  likes: number;
  liked: boolean;
  comments: number;
  verified: boolean;
  verifiedBy: string | null;
  user: { id: string; name: string; institution: string | null; avatarUrl: string | null; isDemo?: boolean };
  commentsList: ObservationComment[];
  identifications: ObservationIdentification[];
}

function photoLicenseUrl(code: string) {
  const license = code.toLowerCase();
  if (license === "cc0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  if (license === "cc-by-sa") return "https://creativecommons.org/licenses/by-sa/4.0/";
  return "https://creativecommons.org/licenses/by/4.0/";
}

export default function ObservationDetail({ observation: initialObservation, currentUserId }: { observation: ObservationDetailRecord; currentUserId: string | null }) {
  const [observation, setObservation] = useState(initialObservation);
  const [comment, setComment] = useState("");
  const [identification, setIdentification] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liking, setLiking] = useState(false);
  const date = observation.observedAt ? new Date(observation.observedAt) : new Date(observation.createdAt);
  const dateLabel = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const coordinates = observation.latitude !== null && observation.longitude !== null
    ? `${observation.latitude.toFixed(2)}°, ${observation.longitude.toFixed(2)}°`
    : "Lieu précis non partagé";

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/observations/${observation.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Réponse non envoyée.");
      setObservation((current) => ({ ...current, comments: current.comments + 1, commentsList: [...current.commentsList, { ...result.comment, isDemo: false, createdAt: new Date(result.comment.createdAt).toISOString() }] }));
      setComment(""); setNotice("Votre réponse a été ajoutée.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Impossible d’ajouter la réponse."); }
    finally { setBusy(false); }
  }

  async function submitIdentification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identification.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/observations/${observation.id}/identifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taxonName: identification }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Identification non enregistrée.");
      setObservation((current) => ({ ...current, identifications: [result.identification, ...current.identifications.filter((item) => item.user.id !== result.identification.user.id)] }));
      setIdentification(""); setNotice("Votre proposition d’identification a été partagée.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Impossible d’enregistrer l’identification."); }
    finally { setBusy(false); }
  }

  async function shareObservation() {
    try {
      if (navigator.share) await navigator.share({ title: `${observation.plantName} · SunuNature`, text: `Une rencontre avec ${observation.plantName} au ${observation.region}.`, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      setError("Partage indisponible sur cet appareil.");
    }
  }

  async function appreciateObservation() {
    if (!currentUserId) { setError("Connectez-vous pour saluer cette rencontre."); return; }
    setLiking(true); setError("");
    try {
      const response = await fetch(`/api/community/${observation.id}/like`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Appréciation non enregistrée.");
      setObservation((current) => ({ ...current, liked: result.liked, likes: result.likes }));
    } catch (likeError) { setError(likeError instanceof Error ? likeError.message : "Appréciation non enregistrée."); }
    finally { setLiking(false); }
  }

  return (
    <main className="observation-detail-page">
      <nav className="observation-detail-topbar"><BackLink href="/observations" label="Retour aux observations" /><Link href="/" className="observation-detail-brand"><span>✳</span> SunuNature</Link></nav>
      <div className="observation-detail-breadcrumb"><Link href="/">Accueil</Link><span>/</span><Link href="/observations">Observations</Link><span>/</span><span>{observation.plantName}</span></div>

      <section className="observation-detail-hero">
        <div className="observation-detail-image-wrap">
          {observation.imageUrl ? <Image fill sizes="(max-width: 800px) 100vw, 65vw" unoptimized className="observation-detail-image" src={observation.imageUrl} alt={observation.plantName} /> : <div className="observation-image-placeholder">Une rencontre avec le vivant</div>}
          <span className="observation-detail-image-tag"><Eye size={14} /> OBSERVATION DE TERRAIN</span>
          <button className="observation-share-button" onClick={shareObservation}>{copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? "Fiche partagée" : "Partager cette rencontre"}</button>
        </div>
        <aside className="observation-taxon-card">
          <span className="observation-overline"><span /> {ORGANISM_LABELS[observation.organismGroup].toLocaleUpperCase("fr")}</span>
          <h1>{observation.plantName}</h1>
          {observation.scientificName && <p className="observation-taxon-scientific">{observation.scientificName}</p>}
          <span className={`observation-identification-status ${observation.verified ? "confirmed" : "pending"}`}>
            {observation.verified ? <><BadgeCheck size={16} /> Identification confirmée</> : <><Sparkles size={15} /> Identification à confirmer</>}
          </span>
          <div className="observation-author"><Link className="observation-author-avatar" href={`/profile/${observation.user.id}`}>{observation.user.avatarUrl ? <Image src={observation.user.avatarUrl} alt={`Photo de ${observation.user.name}`} width={39} height={39} unoptimized /> : observation.user.name.slice(0, 1).toLocaleUpperCase("fr")}</Link><span><small>OBSERVÉ PAR</small><strong>{observation.user.name}</strong>{observation.user.isDemo ? <small>Compte fictif · démonstration</small> : observation.user.institution && <small>{observation.user.institution}</small>}</span></div>
          <div className="observation-taxon-stats"><button className={`observation-appreciate-button ${observation.liked ? "liked" : ""}`} type="button" aria-pressed={observation.liked} disabled={liking} onClick={() => void appreciateObservation()}><Heart size={16} className={observation.liked ? "fill-current" : ""}/>{observation.liked ? "Belle rencontre saluée" : "Saluer cette rencontre"}<strong>{observation.likes}</strong></button><a href="#discussion"><MessageCircle size={15} /> {observation.comments} échanges</a></div>
          {observation.verifiedBy && <small className="observation-verified-by">Vérifié par {observation.verifiedBy}</small>}
          {observation.isDemo && <div className="observation-demo-source"><strong>Publication de démonstration</strong><span>Observation réelle par {observation.sourceObserver || "un naturaliste iNaturalist"}</span><span>Photo : {observation.photoAttribution || observation.sourceObserver}{observation.photoLicense && <> · <a href={photoLicenseUrl(observation.photoLicense)} target="_blank" rel="noreferrer">Licence {observation.photoLicense.toUpperCase()}</a></>}</span><a href={observation.sourceUrl || "https://www.inaturalist.org"} target="_blank" rel="noreferrer">Consulter la source iNaturalist ↗</a></div>}
        </aside>
      </section>

      <div className="observation-detail-columns">
        <div className="observation-detail-main">
          <section className="observation-info-card">
            <div className="observation-card-title"><span className="observation-icon-tile"><CalendarDays size={17} /></span><div><small>CARNET DE TERRAIN</small><h2>À propos de cette observation</h2></div></div>
            {observation.description && <p className="observation-full-description">{observation.description}</p>}
            <div className="observation-facts-grid"><div><CalendarDays size={16} /><span><small>DATE D’OBSERVATION</small><strong>{dateLabel}</strong></span></div><div><MapPin size={16} /><span><small>LIEU</small><strong>{observation.region}</strong></span></div><div><LockKeyhole size={16} /><span><small>COORDONNÉES</small><strong>{observation.locationVisibility === "PRIVATE" && currentUserId !== observation.userId ? "Privées" : coordinates}</strong></span></div><div><Eye size={16} /><span><small>PARTAGÉE LE</small><strong>{new Date(observation.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong></span></div></div>
            <p className="observation-location-privacy"><LockKeyhole size={14} /> Pour protéger les espèces sensibles, les coordonnées approximatives sont arrondies. La position privée n’est visible que par l’observateur.</p>
          </section>

          <section id="identification" className="observation-info-card observation-identification-card">
            <div className="observation-card-title"><span className="observation-icon-tile"><Sparkles size={17} /></span><div><small>IDENTIFICATION COLLABORATIVE</small><h2>Qu’avez-vous reconnu ?</h2></div></div>
            {observation.identifications.length === 0 ? <p className="observation-section-hint">Aucune proposition pour le moment. Aidez la communauté à identifier cette espèce.</p> : <div className="observation-identification-list">{observation.identifications.map((item) => <div className="observation-identification-item" key={item.id}><span className="observation-id-check"><Check size={15} /></span><span><strong>{item.taxonName}</strong><small>Proposé par {item.user.name} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}</small></span></div>)}</div>}
            {currentUserId ? <form className="observation-inline-form" onSubmit={submitIdentification}><input value={identification} onChange={(event) => setIdentification(event.target.value)} placeholder="Proposer un nom d’espèce…" maxLength={180} required /><button type="submit" disabled={busy}><Send size={15} /> Proposer</button></form> : <p className="observation-login-prompt"><Link href="/connexion">Connectez-vous</Link> pour proposer une identification.</p>}
          </section>
        </div>

        <aside className="observation-detail-sidebar">
          <section className="observation-contribute-card"><span className="observation-side-decoration">✳</span><small>LE SAVOIR EST COLLECTIF</small><h2>Vous connaissez cette espèce ?</h2><p>Partagez un nom local, une identification ou un savoir lié à cette observation.</p><a href="#discussion">Participer à l’échange <ArrowLeft className="rotate-180" size={15} /></a></section>
          <section id="discussion" className="observation-discussion-card"><div className="observation-card-title"><span className="observation-icon-tile"><MessageCircle size={17} /></span><div><small>COMMUNAUTÉ</small><h2>Discussion <span>{observation.comments}</span></h2></div></div>
            {observation.commentsList.length === 0 ? <p className="observation-section-hint">Soyez la première personne à échanger sur cette rencontre.</p> : <div className="observation-comments-list">{observation.commentsList.map((item) => <article className="observation-comment" key={item.id}><span className="observation-comment-avatar">{item.user.name.slice(0, 1).toLocaleUpperCase("fr")}</span><div><div><strong>{item.user.name}</strong><small>{new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</small></div><p>{item.body}</p>{item.isDemo && <small className="observation-demo-comment-label">Commentaire de démonstration</small>}</div></article>)}</div>}
            {currentUserId ? <form className="observation-comment-form" onSubmit={submitComment}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ajouter une réponse…" maxLength={2000} required /><button disabled={busy || !comment.trim()} type="submit"><Send size={15} /> Répondre</button></form> : <p className="observation-login-prompt"><Link href="/connexion">Connectez-vous</Link> pour rejoindre la discussion.</p>}
          </section>
        </aside>
      </div>
      {(error || notice) && <p className={error ? "observation-feedback error" : "observation-feedback"} role={error ? "alert" : "status"}>{error || notice}</p>}
    </main>
  );
}
