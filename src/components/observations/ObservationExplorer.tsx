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

export default function ObservationExplorer({ isAuthenticated, initialQuery }: Readonly<{ isAuthenticated: boolean; initialQuery: string }>) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [group, setGroup] = useState("ALL");
  const [source, setSource] = useState<"iNaturalist" | "TERRA">(initialQuery && isAuthenticated ? "TERRA" : "iNaturalist");
  const [region, setRegion] = useState("ALL");
  const [search, setSearch] = useState(initialQuery);
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadObservations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "48" });
      if (group !== "ALL") query.set("group", group);
      if (search.trim()) query.set("q", search.trim());
      const response = await apiFetch(source === "iNaturalist" ? `/api/naturalist/observations?${query}` : `/api/community?${query}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Les observations ne sont pas disponibles.");
      setObservations(source === "iNaturalist"
        ? (payload.observations || []).map((item: Omit<Observation, "user"> & { observer: string }) => ({ ...item, user: { name: item.observer } }))
        : (payload.data || []).map((item: Observation) => ({ ...item, source: "TERRA" as const })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les observations.");
    } finally {
      setLoading(false);
    }
  }, [group, search, source]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadObservations(); }, 0);
    return () => window.clearTimeout(timer);
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
        <Link href="/connexion" className="observation-contribute-button"><MapPinned size={17} /> Ajouter une observation</Link>
      </header>

      <div className="observation-source-switch" role="tablist" aria-label="Source des observations">
        <button role="tab" aria-selected={source === "iNaturalist"} className={source === "iNaturalist" ? "selected" : ""} onClick={() => setSource("iNaturalist")}>iNaturalist · Monde <ExternalLink size={14} /></button>
        {isAuthenticated && <button role="tab" aria-selected={source === "TERRA"} className={source === "TERRA" ? "selected" : ""} onClick={() => setSource("TERRA")}>Communauté TERRA</button>}
      </div>
      <section className="observation-explorer-toolbar" aria-label="Filtres des observations">
        <label className="observation-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Espèce, lieu, naturaliste…" /></label>
        <label className="observation-select-wrap"><SlidersHorizontal size={15} /><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="ALL">Tous les groupes</option>{ORGANISM_GROUPS.map((item) => <option key={item} value={item}>{ORGANISM_LABELS[item]}</option>)}</select></label>
        <label className="observation-select-wrap"><MapPin size={15} /><select value={region} onChange={(event) => setRegion(event.target.value)}><option value="ALL">Monde entier</option>{Array.from(new Set(observations.map((item) => item.region))).sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <div className="observation-view-switch" aria-label="Mode d’affichage">
          <button aria-label="Grille" title="Grille" className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")}><LayoutGrid size={17} /></button>
          <button aria-label="Liste" title="Liste" className={view === "list" ? "selected" : ""} onClick={() => setView("list")}><List size={18} /></button>
          <button aria-label="Carte" title="Carte" className={view === "map" ? "selected" : ""} onClick={() => setView("map")}><MapPinned size={17} /></button>
        </div>
      </section>

      <div className="observation-results-line"><span>{loading ? "Recherche des observations…" : `${visible.length} observation${visible.length === 1 ? "" : "s"}`}</span><span>{source === "iNaturalist" ? "Données publiques iNaturalist · crédits photo affichés sur chaque fiche" : "Les coordonnées sensibles sont automatiquement approximées."}</span></div>
      {error && <div className="observation-explorer-error">{error} <button onClick={() => void loadObservations()}>Réessayer</button></div>}
      {loading && <div className="observation-loading"><LoaderCircle className="animate-spin" size={22} /> Chargement des découvertes…</div>}
      {!loading && view === "map" && <ObservationMap observations={pins} />}
      {!loading && !error && visible.length === 0 && <div className="observation-empty"><span>🌱</span><h2>Le carnet attend votre regard.</h2><p>Aucune observation ne correspond encore à ces filtres.</p><Link href="/connexion">Partager la première <ArrowRight size={16} /></Link></div>}
      {!loading && visible.length > 0 && view !== "map" && <div className={`observation-card-grid ${view === "list" ? "list-view" : ""}`}>
        {visible.map((observation) => <Link className="explorer-observation-card" href={`/observations/${observation.id}`} key={observation.id}>
          <div className="explorer-observation-photo">{observation.videoUrl ? <video src={observation.videoUrl} poster={observation.imageUrl} controls playsInline preload="metadata" /> : <Image fill sizes="(max-width: 650px) 100vw, 33vw" unoptimized src={observation.imageUrl} alt={observation.plantName} />}<span>{ORGANISM_LABELS[observation.organismGroup]}</span></div>
          <div className="explorer-observation-copy"><div className="explorer-observation-meta"><span><MapPin size={13} />{observation.region}</span><span><CalendarDays size={13} />{observation.observedAt ? new Date(observation.observedAt).toLocaleDateString("fr-FR") : "Récemment"}</span></div><h2>{observation.plantName}</h2>{observation.scientificName && <p className="explorer-scientific-name">{observation.scientificName}</p>}<p className="explorer-observation-description">{observation.description}</p><span className="explorer-observer">Observé par <strong>{observation.user.name}</strong></span>{observation.source === "iNaturalist" && <small className="observation-photo-credit">iNaturalist · {observation.photoAttribution}{observation.photoLicense ? ` · ${observation.photoLicense}` : ""}</small>}</div>
        </Link>)}
      </div>}
    </main>
  );
}
