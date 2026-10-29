"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, ExternalLink, LayoutGrid, List, LoaderCircle, MapPin, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { ORGANISM_GROUPS, ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";
import type { ObservationPin } from "./ObservationMap";

const ObservationMap = dynamic(() => import("./ObservationMap"), { ssr: false, loading: () => <div className="observation-map-loading">Ouverture de la carte…</div> });

type Observation = {
  id: string;
  plantName: string;
  scientificName: string;
  organismGroup: OrganismGroup;
  imageUrl: string;
  videoUrl?: string | null;
  region: string;
  description: string | null;
  observedAt: string | null;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  user: { name: string };
  source?: "TERRA" | "iNaturalist";
  sourceUrl?: string;
  photoAttribution?: string;
  photoLicense?: string | null;
};

export default function ObservationExplorer({ isAuthenticated, initialQuery, initialSource }: Readonly<{ isAuthenticated: boolean; initialQuery: string; initialSource?: "iNaturalist" | "TERRA" }>) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [group, setGroup] = useState("ALL");
  const [source, setSource] = useState<"iNaturalist" | "TERRA">(initialSource === "TERRA" && isAuthenticated ? "TERRA" : initialSource === "iNaturalist" ? "iNaturalist" : initialQuery && isAuthenticated ? "TERRA" : "iNaturalist");
  const [region, setRegion] = useState("ALL");
  const [search, setSearch] = useState(initialQuery);
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadObservations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "48" });
      if (group !== "ALL") query.set("group", group);
      if (search.trim()) query.set("q", search.trim());
      const response = await apiFetch(source === "iNaturalist" ? `/api/naturalist/observations?${query}` : `/api/community?${query}`, { signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Les observations ne sont pas disponibles.");
      setObservations(source === "iNaturalist"
        ? (payload.observations || []).map((item: Omit<Observation, "user"> & { observer: string }) => ({ ...item, user: { name: item.observer } }))
        : (payload.data || []).map((item: Observation) => ({ ...item, source: "TERRA" as const })));
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Impossible de charger les observations.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [group, search, source]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadObservations(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadObservations]);

  const visible = useMemo(() => observations.filter((observation) => {
    const query = search.trim().toLocaleLowerCase("fr");
    const matchesQuery = !query || [observation.plantName, observation.scientificName, observation.description, observation.region, observation.user.name].some((value) => value?.toLocaleLowerCase("fr").includes(query));
    return matchesQuery && (region === "ALL" || observation.region === region);
  }), [observations, region, search]);

  const pins: ObservationPin[] = visible.flatMap((observation) => observation.latitude !== null && observation.longitude !== null ? [{
    id: observation.id,
    name: observation.plantName,
    group: ORGANISM_LABELS[observation.organismGroup],
    region: observation.region,
    date: observation.observedAt ? new Date(observation.observedAt).toLocaleDateString("fr-FR") : "Date non précisée",
    imageUrl: observation.imageUrl,
    latitude: observation.latitude,
    longitude: observation.longitude,
  }] : []);

  return (
    <main className="observations-explorer">
      <header className="observations-explorer-heading">
        <div>
          <span className="observation-overline"><span /> LE CARNET DU VIVANT</span>
          <h1>Observations de la nature</h1>
          <p>Explorez les découvertes naturalistes du monde entier et les histoires de terrain partagées par la communauté.</p>
        </div>
        <Link href={isAuthenticated ? "/explorer?section=fil&publier=1" : "/connexion?next=%2Fexplorer%3Fsection%3Dobservations"} className="observation-contribute-button"><MapPinned size={17} /> Ajouter une observation</Link>
      </header>

      <div className="observation-source-switch" role="group" aria-label="Source des observations">
        <button type="button" aria-pressed={source === "iNaturalist"} className={source === "iNaturalist" ? "selected" : ""} onClick={() => setSource("iNaturalist")}>iNaturalist · Monde <ExternalLink size={14} aria-hidden="true" /></button>
        {isAuthenticated && <button type="button" aria-pressed={source === "TERRA"} className={source === "TERRA" ? "selected" : ""} onClick={() => setSource("TERRA")}>Communauté TERRA</button>}
      </div>
      <section className="observation-explorer-toolbar" aria-label="Filtres des observations">
        <label className="observation-search"><Search size={17} aria-hidden="true" /><input aria-label="Rechercher une espèce, un lieu ou un naturaliste" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Espèce, lieu, naturaliste…" /></label>
        <label className="observation-select-wrap"><SlidersHorizontal size={15} aria-hidden="true" /><select aria-label="Filtrer par groupe vivant" value={group} onChange={(event) => setGroup(event.target.value)}><option value="ALL">Tous les groupes</option>{ORGANISM_GROUPS.map((item) => <option key={item} value={item}>{ORGANISM_LABELS[item]}</option>)}</select></label>
        <label className="observation-select-wrap"><MapPin size={15} aria-hidden="true" /><select aria-label="Filtrer par région" value={region} onChange={(event) => setRegion(event.target.value)}><option value="ALL">Monde entier</option>{Array.from(new Set(observations.map((item) => item.region))).sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <div className="observation-view-switch" role="group" aria-label="Mode d’affichage">
          <button type="button" aria-pressed={view === "grid"} aria-label="Grille" title="Grille" className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")}><LayoutGrid size={17} /></button>
          <button type="button" aria-pressed={view === "list"} aria-label="Liste" title="Liste" className={view === "list" ? "selected" : ""} onClick={() => setView("list")}><List size={18} /></button>
          <button type="button" aria-pressed={view === "map"} aria-label="Carte" title="Carte" className={view === "map" ? "selected" : ""} onClick={() => setView("map")}><MapPinned size={17} /></button>
        </div>
      </section>

      <div className="observation-results-line" aria-live="polite"><span>{loading ? "Recherche des observations…" : `${visible.length} observation${visible.length === 1 ? "" : "s"}`}</span><span>{source === "iNaturalist" ? "Données publiques iNaturalist · crédits photo affichés sur chaque fiche" : "Les coordonnées sensibles sont automatiquement approximées."}</span></div>
      {error && <div className="observation-explorer-error" role="alert">{error} <button type="button" onClick={() => void loadObservations()}>Réessayer</button></div>}
      {loading && <div className="observation-loading" role="status"><LoaderCircle className="animate-spin" size={22} /> Chargement des découvertes…</div>}
      {!loading && !error && view === "map" && <ObservationMap observations={pins} />}
      {!loading && !error && visible.length === 0 && <div className="observation-empty"><span aria-hidden="true">🌱</span><h2>{observations.length ? "Aucun résultat pour ces filtres." : "Le carnet attend votre regard."}</h2><p>{observations.length ? "Essayez une autre recherche ou élargissez les filtres." : "Aucune observation ne correspond encore à ces filtres."}</p>{observations.length ? <button type="button" onClick={() => { setSearch(""); setGroup("ALL"); setRegion("ALL"); }}>Effacer les filtres</button> : <Link href={isAuthenticated ? "/explorer?section=fil&publier=1" : "/connexion?next=%2Fexplorer%3Fsection%3Dfil%26publier%3D1"}>Partager la première <ArrowRight size={16} /></Link>}</div>}
      {!loading && visible.length > 0 && view !== "map" && <div className={`observation-card-grid ${view === "list" ? "list-view" : ""}`}>
        {visible.map((observation) => <article className="explorer-observation-card" key={observation.id}>
          <div className="explorer-observation-photo">{observation.videoUrl ? <video src={observation.videoUrl} poster={observation.imageUrl} controls playsInline preload="metadata" aria-label={`Vidéo de ${observation.plantName}`} /> : <Link href={`/observations/${observation.id}`} aria-label={`Ouvrir l’observation ${observation.plantName}`}><Image fill sizes="(max-width: 650px) 100vw, 33vw" unoptimized src={observation.imageUrl} alt={observation.plantName} /></Link>}<span>{ORGANISM_LABELS[observation.organismGroup]}</span></div>
          <div className="explorer-observation-copy"><div className="explorer-observation-meta"><span><MapPin size={13} />{observation.region}</span><span><CalendarDays size={13} />{observation.observedAt ? new Date(observation.observedAt).toLocaleDateString("fr-FR") : "Récemment"}</span></div><h2><Link href={`/observations/${observation.id}`}>{observation.plantName}</Link></h2>{observation.scientificName && <p className="explorer-scientific-name">{observation.scientificName}</p>}{observation.description && <p className="explorer-observation-description">{observation.description}</p>}<span className="explorer-observer">Observé par <strong>{observation.user.name}</strong></span>{observation.source === "iNaturalist" && <small className="observation-photo-credit">iNaturalist · {observation.photoAttribution}{observation.photoLicense ? ` · ${observation.photoLicense}` : ""}</small>}<Link className="explorer-observation-open" href={`/observations/${observation.id}`}>Voir la fiche <ArrowRight size={14} /></Link></div>
        </article>)}
      </div>}
    </main>
  );
}
