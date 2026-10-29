"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { ArrowUpRight, CalendarDays, MapPin, RefreshCw } from "lucide-react";
import type { CSSProperties } from "react";

type RelatedObservation = {
  id: string;
  sourceUrl: string;
  plantName: string;
  scientificName: string;
  imageUrl: string;
  photoAttribution: string;
  photoLicense: string | null;
  region: string;
  observedAt: string | null;
  observer: string;
};

function licenseLink(code: string) {
  switch (code.toLowerCase()) {
    case "cc0": return "https://creativecommons.org/publicdomain/zero/1.0/";
    case "cc-by-sa": return "https://creativecommons.org/licenses/by-sa/4.0/";
    default: return "https://creativecommons.org/licenses/by/4.0/";
  }
}

export default function RelatedSpeciesObservations({ scientificName }: Readonly<{ scientificName: string }>) {
  const [observations, setObservations] = useState<RelatedObservation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ taxon: scientificName, limit: "6" });
      const response = await apiFetch(`/api/naturalist/observations?${params}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Les observations externes sont indisponibles.");
      if (signal.aborted) return;
      setObservations((data.observations || []).filter((item: RelatedObservation) => item.imageUrl && item.photoLicense));
      setTotal(data.total || 0);
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof Error ? cause.message : "Les observations externes sont indisponibles.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [scientificName]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  return <section className="terra-related-observations" aria-labelledby="terra-related-observations-title">
    <header><div><span>OBSERVATIONS · iNATURALIST</span><h2 id="terra-related-observations-title">Rencontres associées à <i>{scientificName}</i></h2><p>Recherche par nom scientifique; un nom ambigu peut limiter les correspondances. Les photos affichées ont une licence réutilisable et gardent leurs crédits. Ces observations externes ne valident pas la fiche taxonomique.</p></div><Link href={`/explorer?section=observations&source=iNaturalist&q=${encodeURIComponent(scientificName)}`}>Toutes les observations <ArrowUpRight size={14} /></Link></header>
    {loading && <p className="terra-related-status" role="status">Recherche d’observations publiques…</p>}
    {!loading && error && <div className="terra-related-error" role="alert"><p>{error}</p><button type="button" onClick={() => void load(new AbortController().signal)}><RefreshCw size={14} /> Réessayer</button></div>}
    {!loading && !error && observations.length === 0 && <p className="terra-related-status">Aucune observation photographique avec licence compatible n’est disponible pour ce nom dans iNaturalist. Cela ne signifie pas que l’espèce est absente.</p>}
    {!loading && !error && observations.length > 0 && <><p className="terra-related-total">{total.toLocaleString("fr-FR")} observations trouvées dans iNaturalist · {observations.length} affichées</p><div className="terra-related-grid">{observations.map((observation) => <article className="terra-related-card" key={observation.id}>
      <Link href={observation.sourceUrl} target="_blank" rel="noreferrer" className="terra-related-photo" style={{ "--terra-related-background": `url(${JSON.stringify(observation.imageUrl)})` } as CSSProperties} aria-label={`Ouvrir la source iNaturalist pour ${observation.plantName}`}>
        <Image src={observation.imageUrl} alt={`Observation de ${observation.plantName}`} width={640} height={480} unoptimized />
      </Link>
      <div className="terra-related-copy"><strong>{observation.observer}</strong><span><MapPin size={13} />{observation.region}</span>{observation.observedAt && <span><CalendarDays size={13} />{new Date(observation.observedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>}<small>{observation.photoAttribution} · {observation.photoLicense?.toUpperCase()}</small><a href={licenseLink(observation.photoLicense || "cc-by")} target="_blank" rel="noreferrer">Conditions de licence</a></div>
    </article>)}</div></>}
  </section>;
}
