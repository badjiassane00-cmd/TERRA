"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Bird, Bug, Camera, Leaf, MapPin, PawPrint, RefreshCw, TreePine } from "lucide-react";
import { ORGANISM_LABELS, type OrganismGroup } from "@/types/nature";

type Observation = { id: string; plantName: string; scientificName?: string | null; region?: string | null; organismGroup: OrganismGroup; imageUrl?: string | null; user?: { name?: string } };
const GROUPS: Array<{ group: OrganismGroup; icon: typeof Leaf }> = [
  { group: "PLANT", icon: Leaf }, { group: "INSECT", icon: Bug }, { group: "BIRD", icon: Bird }, { group: "MAMMAL", icon: PawPrint }, { group: "OTHER", icon: TreePine },
];

export default function BiodiversityPulse({ onSelectGroup }: { onSelectGroup: (group: OrganismGroup) => void }) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/community?limit=50", { cache: "no-store", signal });
      if (!response.ok) return;
      const payload = await response.json() as { data?: Observation[] };
      if (!signal?.aborted) { setObservations(Array.isArray(payload.data) ? payload.data : []); setUpdatedAt(new Date()); }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") console.error("Pulse biodiversité indisponible", error);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = window.setInterval(() => void refresh(), 120_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [refresh]);
  const stats = useMemo(() => {
    const taxa = new Set(observations.map((item) => (item.scientificName || item.plantName).trim().toLocaleLowerCase("fr")).filter(Boolean));
    const regions = new Map<string, number>();
    const groups = new Map<OrganismGroup, number>();
    observations.forEach((item) => { if (item.region) regions.set(item.region, (regions.get(item.region) || 0) + 1); groups.set(item.organismGroup, (groups.get(item.organismGroup) || 0) + 1); });
    return { taxa: taxa.size, topRegion: [...regions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0], groups };
  }, [observations]);
  const latest = observations[0];
  return <section className="biodiversity-pulse" aria-labelledby="biodiversity-pulse-title">
    <div className="biodiversity-pulse-main">
      <div className="biodiversity-pulse-heading"><span className="biodiversity-pulse-kicker"><Activity size={13} /> RADAR CITOYEN · AFRIQUE</span><button className="biodiversity-pulse-refresh" type="button" onClick={() => void refresh()} aria-label="Actualiser le radar"><RefreshCw size={14} /> Actualiser</button></div>
      <h2 id="biodiversity-pulse-title">Le vivant, <em>en mouvement.</em></h2>
      <p className="biodiversity-pulse-intro">Un instantané des découvertes partagées par la communauté. Les chiffres portent sur les 50 observations les plus récentes.</p>
      <div className="biodiversity-pulse-stats"><article><strong>{loading ? "—" : observations.length}</strong><span>observations récentes</span></article><article><strong>{loading ? "—" : stats.taxa}</strong><span>espèces distinctes nommées</span></article><article><strong>{loading ? "…" : stats.topRegion || "À découvrir"}</strong><span>région la plus active</span></article></div>
      <div className="biodiversity-pulse-groups" aria-label="Filtrer les observations par groupe">{GROUPS.map(({ group, icon: Icon }) => <button type="button" key={group} onClick={() => onSelectGroup(group)} className={`biodiversity-pulse-chip ${group.toLowerCase()}`}><Icon size={15} /><span>{ORGANISM_LABELS[group]}</span><b>{stats.groups.get(group) || 0}</b></button>)}</div>
      <div className="biodiversity-pulse-footer"><span><i /> Actualisé automatiquement{updatedAt ? ` · ${updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><Link href="/observations">Explorer toutes les rencontres <ArrowUpRight size={14} /></Link></div>
    </div>
    {latest ? <Link href={`/observations/${latest.id}`} className="biodiversity-pulse-feature" style={latest.imageUrl ? { backgroundImage: `linear-gradient(180deg, transparent 20%, #10271fe8 100%), url("${latest.imageUrl.replaceAll('"', "%22")}")` } : undefined}>
      <span className="biodiversity-pulse-feature-tag"><Activity size={12} /> DERNIÈRE RENCONTRE</span><span className="biodiversity-pulse-feature-copy"><small><MapPin size={12} /> {latest.region || "Afrique"}</small><strong>{latest.plantName}</strong><span>{ORGANISM_LABELS[latest.organismGroup]}{latest.user?.name ? ` · par ${latest.user.name}` : ""}</span></span><span className="biodiversity-pulse-feature-arrow"><ArrowUpRight size={17} /></span>
    </Link> : <button type="button" className="biodiversity-pulse-empty" onClick={() => window.dispatchEvent(new Event("sununature:compose"))}><Camera size={25} /><strong>Votre découverte peut ouvrir le radar.</strong><span>Partagez la première rencontre de la communauté.</span></button>}
  </section>;
}
