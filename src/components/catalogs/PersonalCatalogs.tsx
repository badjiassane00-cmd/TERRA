"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Leaf, LoaderCircle, Plus } from "lucide-react";
import { ORGANISM_GROUPS, ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

type Entry = { id: string; name: string; scientificName: string | null; group: OrganismGroup; imageUrl: string | null; videoUrl: string | null; note: string | null };
type Catalog = { id: string; title: string; description: string | null; entries: Entry[]; _count: { entries: number } };

export default function PersonalCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeCatalog, setActiveCatalog] = useState("");
  const [entryName, setEntryName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [group, setGroup] = useState<OrganismGroup>("PLANT");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/catalogues", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les catalogues.");
      setCatalogs(payload.catalogs || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur de chargement.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function createCatalog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/catalogues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Création impossible.");
      setTitle(""); setDescription(""); setActiveCatalog(payload.catalog.id); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Création impossible."); }
    finally { setBusy(false); }
  }

  async function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCatalog) return;
    setBusy(true); setError("");
    try {
      const response = await apiFetch(`/api/catalogues/${activeCatalog}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: entryName, scientificName, group, imageUrl, videoUrl, note }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ajout impossible.");
      setEntryName(""); setScientificName(""); setImageUrl(""); setVideoUrl(""); setNote(""); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ajout impossible."); }
    finally { setBusy(false); }
  }

  async function uploadMedia(file?: File) {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await apiFetch("/api/media/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Téléversement impossible.");
      if (data.mediaType === "video") setVideoUrl(data.videoUrl);
      else setImageUrl(data.imageUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Téléversement impossible."); }
    finally { setUploading(false); }
  }

  return <main className="personal-catalog-page">
    <div className="personal-catalog-intro"><span><BookOpen size={15} /> MON CARNET NATURALISTE</span><h1>Mes catalogues<br /><em>du vivant</em></h1><p>Créez vos propres collections pour classer vos plantes, arbres, insectes, oiseaux, champignons et toute autre rencontre.</p></div>
    <div className="personal-catalog-layout">
      <section className="personal-catalog-panel"><h2><Plus size={19} /> Nouveau catalogue</h2><p>Donnez un thème à votre collection : jardin, sorties, espèces à suivre…</p><form onSubmit={createCatalog}><label>Nom du catalogue<input maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Arbres de mon quartier" /></label><label>Description<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Le fil conducteur de cette collection" /></label><button disabled={busy}><Plus size={16} /> Créer mon catalogue</button></form></section>
      <section className="personal-catalog-panel personal-catalog-add"><h2><Leaf size={19} /> Ajouter une espèce</h2><p>Ajoutez une observation à l’un de vos catalogues personnels.</p><form onSubmit={addEntry}><label>Catalogue<select required value={activeCatalog} onChange={(event) => setActiveCatalog(event.target.value)}><option value="">Choisir un catalogue</option>{catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.title}</option>)}</select></label><div className="personal-catalog-form-grid"><label>Nom courant<input maxLength={120} value={entryName} onChange={(event) => setEntryName(event.target.value)} placeholder="Ex. Papillon monarque" /></label><label>Nom scientifique<input maxLength={160} value={scientificName} onChange={(event) => setScientificName(event.target.value)} placeholder="Danaus plexippus" /></label></div><div className="personal-catalog-form-grid"><label>Groupe<select value={group} onChange={(event) => setGroup(event.target.value as OrganismGroup)}>{ORGANISM_GROUPS.map((item) => <option key={item} value={item}>{ORGANISM_LABELS[item]}</option>)}</select></label><label>Photo / vidéo (facultatif)<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={(event) => void uploadMedia(event.target.files?.[0])} /></label></div><label>Note de terrain<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Lieu, date, caractéristiques…" /></label><button disabled={busy || uploading || !activeCatalog}><Plus size={16} /> {uploading ? "Téléversement…" : "Ajouter au catalogue"}</button></form></section>
    </div>
    {error && <p className="personal-catalog-error" role="alert">{error}</p>}
    <section className="personal-catalog-list"><div className="personal-catalog-list-heading"><div><span>VOS COLLECTIONS</span><h2>Bibliothèque naturaliste</h2></div><Link href="/observations">Explorer les observations</Link></div>
      {loading ? <p className="personal-catalog-loading"><LoaderCircle className="animate-spin" size={19} /> Chargement des catalogues…</p> : catalogs.length === 0 ? <div className="personal-catalog-empty"><BookOpen size={28} /><p>Votre bibliothèque est encore vide. Créez un catalogue pour commencer.</p></div> : <div className="personal-catalog-grid">{catalogs.map((catalog) => <article className={`personal-catalog-card ${activeCatalog === catalog.id ? "selected" : ""}`} key={catalog.id}><button className="personal-catalog-card-select" onClick={() => setActiveCatalog(catalog.id)}><span>{catalog._count.entries} entrée{catalog._count.entries === 1 ? "" : "s"}</span><h3>{catalog.title}</h3><p>{catalog.description || "Collection personnelle"}</p></button>{catalog.entries.length > 0 && <div className="personal-catalog-entry-list">{catalog.entries.map((entry) => <div className="personal-catalog-entry" key={entry.id}>{entry.videoUrl ? <video className="personal-catalog-entry-media" src={entry.videoUrl} controls preload="metadata" /> : entry.imageUrl ? <Image src={entry.imageUrl} alt="" width={52} height={52} unoptimized /> : <span className="personal-catalog-entry-icon"><Leaf size={18} /></span>}<div><strong>{entry.name || "Entrée sans nom"}</strong>{entry.scientificName && <i>{entry.scientificName}</i>}<small>{ORGANISM_LABELS[entry.group]}{entry.note ? ` · ${entry.note}` : ""}</small></div></div>)}</div>}</article>)}</div>}
    </section>
  </main>;
}
