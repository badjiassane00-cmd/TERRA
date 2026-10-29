"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import SeasonalCalendar from "@/components/ecology/SeasonalCalendar";
import PollinatorNetwork from "@/components/ecology/PollinatorNetwork";
import LocalBiodiversityAlerts from "@/components/ecology/LocalBiodiversityAlerts";
import SoundRecorder from "@/components/ecology/SoundRecorder";

type EcologyData = {
  calendar: Array<{ month: number; count: number; speciesCount: number }>;
  currentMonth: { species: string[] };
  sourceCount: number;
  relations: Array<{ plant: string; insect: string; occurrences: number }>;
};

export default function NatureCompanion() {
  const [region, setRegion] = useState("Sénégal");
  const [data, setData] = useState<EcologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`/api/ecology?region=${encodeURIComponent(region)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Les données écologiques sont indisponibles.");
        setData(result as EcologyData);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Les données écologiques sont indisponibles.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [region, retryCount]);
  return <section className="mt-8" aria-labelledby="nature-companion-title">
    <div className="mb-5"><span className="text-xs font-semibold tracking-[.18em] text-primary">OUTILS DE TERRAIN</span><h2 id="nature-companion-title" className="mt-1 font-serif text-2xl font-bold">Le vivant au fil des saisons</h2><p className="mt-1 text-sm text-foreground/60">Des repères construits à partir des observations publiques de la communauté.</p></div>
    {loading && <p className="flex min-h-28 items-center justify-center gap-3 rounded-xl border border-border bg-paper text-sm text-foreground/70" role="status"><LoaderCircle size={18} className="animate-spin" /> Chargement des observations écologiques…</p>}
    {error && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert"><p>{error}</p><button className="herbarium-button inline-flex min-h-11 items-center gap-2" type="button" onClick={() => { setError(""); setLoading(true); setRetryCount((count) => count + 1); }}><RefreshCw size={15} /> Réessayer</button></div>}
    {!loading && !error && data && <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <SeasonalCalendar region={region} onRegionChange={(nextRegion) => { setError(""); setLoading(true); setRegion(nextRegion); }} data={data}/>
      <PollinatorNetwork relations={data?.relations || []}/>
      <SoundRecorder/>
      <LocalBiodiversityAlerts/>
    </div>}
  </section>;
}
