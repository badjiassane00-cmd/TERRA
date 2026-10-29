"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Filter, Leaf, Search, ShieldCheck } from "lucide-react";

type SpeciesResult = {
  key: number;
  scientificName: string;
  canonicalName: string;
  authorship: string | null;
  rank: string | null;
  kingdom: string | null;
  phylum: string | null;
  class: string | null;
  order: string | null;
  family: string | null;
  genus: string | null;
  taxonomicStatus: string | null;
  sourceUrl: string;
  image?: { url: string; title: string | null; creator: string | null; publisher: string | null; license: string; licenseUrl: string; sourceUrl: string | null };
};

type SearchState = { results: SpeciesResult[]; count: number; endOfRecords: boolean };
type FeaturedPage = { results: SpeciesResult[]; nextOffset: number; endOfRecords: boolean };

const EMPTY: SearchState = { results: [], count: 0, endOfRecords: true };

function speciesPreviewUrl(source: string) {
  try {
    const url = new URL(source);
    if (url.hostname !== "inaturalist-open-data.s3.amazonaws.com") return source;
    url.pathname = url.pathname.replace(/\/original\.(jpe?g|png)$/i, "/medium.$1");
    return url.href;
  } catch {
    return source;
  }
}

const KINGDOMS = [
  ["", "Tous les règnes"], ["Plantae", "Plantes"], ["Animalia", "Animaux"], ["Fungi", "Champignons"],
  ["Bacteria", "Bactéries"], ["Archaea", "Archées"], ["Chromista", "Chromistes"], ["Protozoa", "Protozoaires"], ["Viruses", "Virus · catégorie distincte"],
];
const RANKS = [["", "Tous les rangs"], ["SPECIES", "Espèces"], ["GENUS", "Genres"], ["FAMILY", "Familles"], ["ORDER", "Ordres"], ["CLASS", "Classes"], ["PHYLUM", "Embranchements"]];

export default function SpeciesExplorer({ initialQuery = "", initialKingdom = "", initialRank = "", initialHabitat = "", initialThreatStatus = "", featuredPage = { results: [], nextOffset: 0, endOfRecords: true } }: { initialQuery?: string; initialKingdom?: string; initialRank?: string; initialHabitat?: string; initialThreatStatus?: string; featuredPage?: FeaturedPage }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [kingdom, setKingdom] = useState(initialKingdom);
  const [rank, setRank] = useState(initialRank);
  const [habitat, setHabitat] = useState(initialHabitat);
  const [threatStatus, setThreatStatus] = useState(initialThreatStatus);
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState<SearchState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [featuredSpecies, setFeaturedSpecies] = useState(featuredPage.results);
  const [featuredOffset, setFeaturedOffset] = useState(featuredPage.nextOffset);
  const [featuredEnd, setFeaturedEnd] = useState(featuredPage.endOfRecords);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState("");
  const hasActiveSearch = query.trim().length >= 2 || Boolean(kingdom || rank || habitat || threatStatus);

  async function loadMoreFeatured() {
    if (featuredLoading || featuredEnd) return;
    setFeaturedLoading(true);
    setFeaturedError("");
    try {
      const response = await fetch(`/api/species/featured?offset=${featuredOffset}`, { cache: "no-store" });
      const result = await response.json() as FeaturedPage & { error?: string };
      if (!response.ok) throw new Error(result.error || "Chargement des espèces impossible.");
      setFeaturedSpecies((previous) => {
        const keys = new Set(previous.map((item) => item.key));
        return [...previous, ...result.results.filter((item) => !keys.has(item.key))];
      });
      setFeaturedOffset(result.nextOffset);
      setFeaturedEnd(result.endOfRecords);
    } catch (cause) {
      setFeaturedError(cause instanceof Error ? cause.message : "Chargement des espèces impossible.");
    } finally {
      setFeaturedLoading(false);
    }
  }

  useEffect(() => {
    const term = query.trim();
    const params = new URLSearchParams();
    if (term.length >= 2) params.set("q", term);
    if (kingdom) params.set("kingdom", kingdom);
    if (rank) params.set("rank", rank);
    if (habitat) params.set("habitat", habitat);
    if (threatStatus) params.set("threatStatus", threatStatus);
    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `/biodiversite?${queryString}` : "/biodiversite");

    if (!hasActiveSearch) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        params.set("page", String(page));
        const response = await fetch(`/api/species/search?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Recherche momentanément indisponible.");
        const pageData = result as SearchState;
        setData((previous) => {
          if (page === 0) return pageData;
          const seen = new Set(previous.results.map((item) => item.key));
          const nextResults = pageData.results.filter((item) => {
            if (seen.has(item.key)) return false;
            seen.add(item.key);
            return true;
          });
          return { ...pageData, results: [...previous.results, ...nextResults] };
        });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Recherche momentanément indisponible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, page === 0 ? 320 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, kingdom, rank, habitat, threatStatus, page, retryCount, hasActiveSearch]);

  const suggestions = focused && query.trim().length >= 2 && !loading ? data.results.slice(0, 5) : [];

  return <main className="species-explorer">
    <section className="species-hero" aria-labelledby="species-title">
      <div className="species-hero-copy">
        <span className="species-eyebrow"><Leaf size={15} /> ENCYCLOPÉDIE DOCUMENTÉE · CONNECTÉE À GBIF</span>
        <h1 id="species-title">Explorer<br /><em>la biodiversité.</em></h1>
        <p>Parcourez les noms scientifiques, la classification et les sources disponibles sur les espèces du monde vivant. Chaque information renvoie à son registre documentaire.</p>
      </div>
      <div className="species-hero-stamp"><span>VIVANT</span><strong>01</strong><small>DU MICROBE<br />À L’ÉCOSYSTÈME</small></div>
    </section>

    <section className="species-search-panel" aria-label="Recherche dans l’encyclopédie">
      <div className="species-searchbox">
        <Search size={21} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => { const value = event.target.value; setQuery(value); setPage(0); if (value.trim().length < 2) { setData(EMPTY); setError(""); setLoading(false); } }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 130)}
          onKeyDown={(event) => { if (event.key === "Escape") setFocused(false); if (event.key === "Enter" && data.results[0]) router.push(`/especes/${data.results[0].key}`); }}
          aria-label="Nom d’espèce, nom scientifique ou nom commun"
          role="combobox"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="species-suggestions"
          aria-expanded={suggestions.length > 0}
          placeholder="Nom d’espèce, nom scientifique ou nom commun…"
        />
        <kbd>ENTRÉE</kbd>
        {suggestions.length > 0 && <ul id="species-suggestions" className="species-autocomplete" aria-label="Suggestions d’espèces">
          {suggestions.map((item) => <li key={item.key}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => router.push(`/especes/${item.key}`)}><strong><i>{item.canonicalName}</i></strong><small>{item.kingdom || "Règne non indiqué"} · {item.rank || "rang non indiqué"}<ArrowRight size={13} /></small></button></li>)}
        </ul>}
      </div>
      <div className="species-filter-title"><Filter size={14} /> Affiner la recherche</div>
      <div className="species-filters">
        <label>Règne<select value={kingdom} onChange={(event) => { setKingdom(event.target.value); setPage(0); }}>{KINGDOMS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Rang taxonomique<select value={rank} onChange={(event) => { setRank(event.target.value); setPage(0); }}>{RANKS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Milieu<select value={habitat} onChange={(event) => { setHabitat(event.target.value); setPage(0); }}><option value="">Tous les milieux</option><option value="TERRESTRIAL">Terrestre</option><option value="FRESHWATER">Eau douce</option><option value="MARINE">Marin</option></select></label>
        <label>Statut UICN<select value={threatStatus} onChange={(event) => { setThreatStatus(event.target.value); setPage(0); }}><option value="">Tous les statuts</option><option value="CR">En danger critique</option><option value="EN">En danger</option><option value="VU">Vulnérable</option><option value="NT">Quasi menacée</option><option value="LC">Préoccupation mineure</option><option value="DD">Données insuffisantes</option></select></label>
      </div>
    </section>

    <section className="species-search-results" aria-live="polite">
      <div className="species-results-heading"><div><span>RÉSULTATS TAXONOMIQUES</span><h2>{query.trim().length >= 2 ? `Taxons correspondant à « ${query.trim()} »` : hasActiveSearch ? "Taxons selon vos filtres" : "Votre prochaine découverte commence ici"}</h2></div>{hasActiveSearch && data.count > 0 && <span className="species-result-count">{data.count.toLocaleString("fr-FR")} correspondances GBIF</span>}</div>
      {!hasActiveSearch ? <>
        <div className="species-featured-intro"><BookOpen size={20} /><div><h3>Des espèces à découvrir</h3><p>{featuredSpecies.length} fiches illustrées pour commencer. Explorez les espèces signalées au Sénégal dans GBIF, avec leurs sources et licences photo.</p></div></div>
        {featuredSpecies.length ? <><div className="species-featured-grid">{featuredSpecies.map((item) => <article className="species-featured-card" key={item.key}>
          <Link className="species-featured-photo" href={`/especes/${item.key}`} aria-label={`Consulter la fiche de ${item.canonicalName}`}>
            {item.image && <Image src={speciesPreviewUrl(item.image.url)} alt={item.image.title || `Photographie de ${item.canonicalName}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" loading="lazy" unoptimized />}
            <span>{item.kingdom || "Espèce documentée"}</span>
          </Link>
          <div className="species-featured-body"><small>{item.rank || "Espèce"} · {item.class || item.phylum || "Biodiversité"}</small><h3><Link href={`/especes/${item.key}`}><i>{item.canonicalName}</i></Link></h3>{item.authorship && <p>{item.authorship}</p>}
            {item.image && <div className="species-featured-credit"><span>{item.image.creator || item.image.publisher || "Crédit photo"} · {item.image.license}</span>{item.image.sourceUrl && <a href={item.image.sourceUrl} target="_blank" rel="noreferrer">Source photo</a>}</div>}
            <Link className="species-featured-open" href={`/especes/${item.key}`}>Ouvrir la fiche <ArrowRight size={14} /></Link>
          </div>
        </article>)}</div>
          {!featuredEnd && <button className="species-load-more" type="button" disabled={featuredLoading} onClick={loadMoreFeatured}>{featuredLoading ? "Chargement des espèces…" : "Afficher plus d’espèces"}</button>}
          {featuredError && <div className="species-message species-error" role="alert">{featuredError}</div>}
        </> : <div className="species-message">La sélection illustrée est momentanément indisponible. Vous pouvez toujours rechercher une espèce ci-dessus.</div>}
      </> : error ? <div className="species-message species-error" role="alert">{error} <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button></div> : loading && page === 0 && data.results.length === 0 ? <div className="species-message" role="status">Recherche dans le backbone taxonomique GBIF…</div> : data.results.length === 0 ? <div className="species-message"><p>Aucun taxon trouvé. Essayez un autre nom ou élargissez les filtres.</p><button type="button" onClick={() => { setQuery(""); setKingdom(""); setRank(""); setHabitat(""); setThreatStatus(""); setPage(0); }}>Effacer les filtres</button></div> : <>
        <div className="species-card-grid">{data.results.map((item) => <Link className="species-card" key={item.key} href={`/especes/${item.key}`}>
          <div className="species-card-art"><Leaf size={26} /><span>{item.kingdom || "BIODIVERSITÉ"}</span></div>
          <div className="species-card-body"><span className="species-rank">{item.rank || "Taxon"}{item.taxonomicStatus && <span className="species-verified"><ShieldCheck size={12} /> Référencé</span>}</span><h3><i>{item.canonicalName}</i></h3>{item.authorship && <p className="species-authorship">{item.authorship}</p>}<p className="species-taxonomy">{[item.family, item.order, item.class].filter(Boolean).join(" · ") || "Classification détaillée sur la fiche"}</p><span className="species-card-link">Consulter la fiche <ArrowRight size={14} /></span></div>
        </Link>)}</div>
        {!data.endOfRecords && <button className="species-load-more" type="button" disabled={loading} onClick={() => setPage((current) => current + 1)}>{loading ? "Chargement…" : "Afficher plus de résultats"}</button>}
      </>}
      <p className="species-data-note">Taxonomie et résultats de recherche fournis par GBIF. Les résultats communautaires de TERRA, lorsqu’ils sont présentés ailleurs, ne constituent pas une validation scientifique.</p>
    </section>
  </main>;
}
