"use client";

import Link from "next/link";
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
};

type SearchState = { results: SpeciesResult[]; count: number; endOfRecords: boolean };

const EMPTY: SearchState = { results: [], count: 0, endOfRecords: true };

const KINGDOMS = [
  ["", "Tous les règnes"], ["Plantae", "Plantes"], ["Animalia", "Animaux"], ["Fungi", "Champignons"],
  ["Bacteria", "Bactéries"], ["Archaea", "Archées"], ["Chromista", "Chromistes"], ["Protozoa", "Protozoaires"], ["Viruses", "Virus · catégorie distincte"],
];
const RANKS = [["", "Tous les rangs"], ["SPECIES", "Espèces"], ["GENUS", "Genres"], ["FAMILY", "Familles"], ["ORDER", "Ordres"], ["CLASS", "Classes"], ["PHYLUM", "Embranchements"]];

export default function SpeciesExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [kingdom, setKingdom] = useState("");
  const [rank, setRank] = useState("");
  const [habitat, setHabitat] = useState("");
  const [threatStatus, setThreatStatus] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SearchState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

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

    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        params.set("page", String(page));
        const response = await fetch(`/api/species/search?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Recherche momentanément indisponible.");
        const pageData = result as SearchState;
        setData((previous) => ({ ...pageData, results: page === 0 ? pageData.results : [...previous.results, ...pageData.results] }));
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Recherche momentanément indisponible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, page === 0 ? 320 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, kingdom, rank, habitat, threatStatus, page]);

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
          aria-autocomplete="list"
          aria-controls="species-suggestions"
          placeholder="Nom d’espèce, nom scientifique ou nom commun…"
        />
        <kbd>ENTRÉE</kbd>
        {suggestions.length > 0 && <ul id="species-suggestions" className="species-autocomplete" role="listbox" aria-label="Suggestions d’espèces">
          {suggestions.map((item) => <li key={item.key} role="option" aria-selected="false"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => router.push(`/especes/${item.key}`)}><strong><i>{item.canonicalName}</i></strong><small>{item.kingdom || "Règne non indiqué"} · {item.rank || "rang non indiqué"}<ArrowRight size={13} /></small></button></li>)}
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
      <div className="species-results-heading"><div><span>RÉSULTATS TAXONOMIQUES</span><h2>{query.trim().length >= 2 ? `Espèces correspondant à « ${query.trim()} »` : "Votre prochaine découverte commence ici"}</h2></div>{data.count > 0 && <span className="species-result-count">{data.count.toLocaleString("fr-FR")} résultats GBIF</span>}</div>
      {query.trim().length < 2 ? <div className="species-empty"><BookOpen size={28} /><h3>Une encyclopédie mondiale, des sources à portée de clic.</h3><p>Recherchez un organisme par son nom scientifique ou commun, puis explorez sa classification, ses synonymes, ses noms vernaculaires, ses références et ses photos dont la licence est vérifiée.</p><div><span>Plantes</span><span>Animaux</span><span>Champignons</span><span>Bactéries</span><span>Milieux aquatiques</span></div></div> : error ? <div className="species-message species-error" role="alert">{error}</div> : loading && page === 0 && data.results.length === 0 ? <div className="species-message" role="status">Recherche dans le backbone taxonomique GBIF…</div> : data.results.length === 0 ? <div className="species-message">Aucun taxon trouvé. Essayez un autre nom ou élargissez les filtres.</div> : <>
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
