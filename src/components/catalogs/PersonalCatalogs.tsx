"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Check, Leaf, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { ORGANISM_GROUPS, ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

type CatalogMedia = { id: string; mediaUrl: string; mediaType: "image" | "video" };
type Entry = { id: string; name: string; scientificName: string | null; group: OrganismGroup; imageUrl: string | null; videoUrl: string | null; media: CatalogMedia[]; note: string | null };
type Catalog = { id: string; title: string; description: string | null; media: CatalogMedia[]; entries: Entry[]; _count: { entries: number } };

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
  const [editingCatalog, setEditingCatalog] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
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
      const response = await apiFetch(`/api/catalogues/${activeCatalog}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: entryName, scientificName, group, note }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ajout impossible.");
      setEntryName(""); setScientificName(""); setNote(""); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ajout impossible."); }
    finally { setBusy(false); }
  }

  async function updateCatalog(catalogId: string) {
    setBusy(true); setError("");
    try {
      const response = await apiFetch(`/api/catalogues/${catalogId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle, description: editDescription }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      setEditingCatalog(""); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification impossible."); }
    finally { setBusy(false); }
  }

  async function deleteCatalog(catalogId: string) {
    if (!window.confirm("Supprimer ce catalogue et toutes ses entrées ?")) return;
    setBusy(true); setError("");
    try {
      const response = await apiFetch(`/api/catalogues/${catalogId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Suppression impossible.");
      if (activeCatalog === catalogId) setActiveCatalog("");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Suppression impossible."); }
    finally { setBusy(false); }
  }

  async function uploadCatalogMedia(catalogId: string, files: File[], entryId?: string) {
    if (!files.length) return;
    setUploading(true); setError("");
    let savedCount = 0;
    try {
      for (const file of files) {
        const form = new FormData(); form.set("file", file);
        const uploadResponse = await apiFetch("/api/media/upload", { method: "POST", body: form });
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploaded.error || `Échec du téléversement de ${file.name}.`);
        const mediaUrl = uploaded.mediaType === "video" ? uploaded.videoUrl : uploaded.imageUrl;
        const mediaPath = entryId ? `/api/catalogues/${catalogId}/entries/${entryId}/media` : `/api/catalogues/${catalogId}/media`;
        const saveResponse = await apiFetch(mediaPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaUrl, mediaType: uploaded.mediaType }) });
        const saved = await saveResponse.json();
        if (!saveResponse.ok) throw new Error(saved.error || `Impossible d’ajouter ${file.name} au catalogue.`);
        savedCount++;
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Téléversement impossible."); }
    finally {
      setUploading(false);
      if (savedCount) await refresh();
    }
  }

  return <main className="personal-catalog-page">
    <div className="personal-catalog-intro"><span><BookOpen size={15} /> MON CARNET NATURALISTE</span><h1>Mes catalogues<br /><em>du vivant</em></h1><p>Créez vos propres collections pour classer vos plantes, arbres, insectes, oiseaux, champignons et toute autre rencontre.</p></div>
    <div className="personal-catalog-layout">
      <section className="personal-catalog-panel"><h2><Plus size={19} /> Nouveau catalogue</h2><p>Donnez un thème à votre collection : jardin, sorties, espèces à suivre…</p><form onSubmit={createCatalog}><label>Nom du catalogue<input maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Arbres de mon quartier" /></label><label>Description<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Le fil conducteur de cette collection" /></label><button disabled={busy}><Plus size={16} /> Créer mon catalogue</button></form></section>
      <section className="personal-catalog-panel personal-catalog-add"><h2><Leaf size={19} /> Ajouter une espèce</h2><p>Ajoutez une observation à l’un de vos catalogues personnels.</p><form onSubmit={addEntry}><label>Catalogue<select required value={activeCatalog} onChange={(event) => setActiveCatalog(event.target.value)}><option value="">Choisir un catalogue</option>{catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.title}</option>)}</select></label><div className="personal-catalog-form-grid"><label>Nom courant<input maxLength={120} value={entryName} onChange={(event) => setEntryName(event.target.value)} placeholder="Ex. Papillon monarque" /></label><label>Nom scientifique<input maxLength={160} value={scientificName} onChange={(event) => setScientificName(event.target.value)} placeholder="Danaus plexippus" /></label></div><label>Groupe vivant<select value={group} onChange={(event) => setGroup(event.target.value as OrganismGroup)}>{ORGANISM_GROUPS.map((item) => <option key={item} value={item}>{ORGANISM_LABELS[item]}</option>)}</select></label><label>Note de terrain<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Lieu, date, caractéristiques…" /></label><button disabled={busy || uploading || !activeCatalog}><Plus size={16} /> {uploading ? "Téléversement…" : "Ajouter au catalogue"}</button></form></section>
    </div>
    {error && <p className="personal-catalog-error" role="alert">{error}</p>}
    <section className="personal-catalog-list"><div className="personal-catalog-list-heading"><div><span>VOS COLLECTIONS</span><h2>Bibliothèque naturaliste</h2></div><Link href="/observations">Explorer les observations</Link></div>
      {loading ? <p className="personal-catalog-loading"><LoaderCircle className="animate-spin" size={19} /> Chargement des catalogues…</p> : catalogs.length === 0 ? <div className="personal-catalog-empty"><BookOpen size={28} /><p>Votre bibliothèque est encore vide. Créez un catalogue pour commencer.</p></div> : <div className="personal-catalog-grid">{catalogs.map((catalog) => <article className={`personal-catalog-card ${activeCatalog === catalog.id ? "selected" : ""}`} key={catalog.id}>
        {editingCatalog === catalog.id ? <form className="personal-catalog-edit-form" onSubmit={(event) => { event.preventDefault(); void updateCatalog(catalog.id); }}><input aria-label="Nom du catalogue" maxLength={100} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /><textarea aria-label="Description du catalogue" maxLength={500} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /><div><button type="submit" disabled={busy}><Check size={14}/> Enregistrer</button><button type="button" onClick={() => setEditingCatalog("")}><X size={14}/> Annuler</button></div></form> : <><div className="personal-catalog-card-heading"><button className="personal-catalog-card-select" onClick={() => setActiveCatalog(catalog.id)}><span>{catalog._count.entries} entrée{catalog._count.entries === 1 ? "" : "s"}</span><h3>{catalog.title}</h3><p>{catalog.description || "Collection personnelle"}</p></button><div className="personal-catalog-manage"><button type="button" aria-label={`Modifier ${catalog.title}`} onClick={() => { setEditingCatalog(catalog.id); setEditTitle(catalog.title); setEditDescription(catalog.description || ""); }}><Pencil size={15}/></button><button type="button" aria-label={`Supprimer ${catalog.title}`} onClick={() => void deleteCatalog(catalog.id)}><Trash2 size={15}/></button></div></div>
        <div className="personal-catalog-library-media"><label className="personal-catalog-add-media">{uploading ? "Ajout des médias…" : "Ajouter plusieurs photos ou vidéos"}<input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" disabled={uploading} onChange={(event) => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ""; void uploadCatalogMedia(catalog.id, files); }} /></label>{catalog.media?.length > 0 && <div className="personal-catalog-media-gallery">{catalog.media.map((media) => media.mediaType === "video" ? <video key={media.id} src={media.mediaUrl} controls preload="metadata" /> : <Image key={media.id} src={media.mediaUrl} alt={`Média du catalogue ${catalog.title}`} width={240} height={180} unoptimized />)}</div>}</div>
        {catalog.entries.length > 0 && <div className="personal-catalog-entry-list">{catalog.entries.map((entry) => <div className="personal-catalog-entry-block" key={entry.id}><div className="personal-catalog-entry">{entry.videoUrl ? <video className="personal-catalog-entry-media" src={entry.videoUrl} controls preload="metadata" /> : entry.imageUrl ? <Image src={entry.imageUrl} alt="" width={52} height={52} unoptimized /> : <span className="personal-catalog-entry-icon"><Leaf size={18} /></span>}<div><strong>{entry.name || "Entrée sans nom"}</strong>{entry.scientificName && <i>{entry.scientificName}</i>}<small>{ORGANISM_LABELS[entry.group]}{entry.note ? ` · ${entry.note}` : ""}</small></div></div>
        {entry.media?.length > 0 && <div className="personal-catalog-media-gallery">{entry.media.map((media) => media.mediaType === "video" ? <video key={media.id} src={media.mediaUrl} controls preload="metadata" /> : <Image key={media.id} src={media.mediaUrl} alt={`Média de ${entry.name}`} width={240} height={180} unoptimized />)}</div>}
        <label className="personal-catalog-add-media">{uploading ? "Ajout des médias…" : "Ajouter des photos ou vidéos"}<input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" disabled={uploading} onChange={(event) => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ""; void uploadCatalogMedia(catalog.id, files, entry.id); }} /></label></div>)}</div>}
        {catalog.entries.length === 0 && <p className="personal-catalog-no-entry">Ajoutez une espèce depuis le formulaire ci-dessus, puis enrichissez-la avec plusieurs photos et vidéos.</p>}
        </>}
      </article>)}</div>}
    </section>
  </main>;
}
