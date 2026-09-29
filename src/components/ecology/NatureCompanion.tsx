"use client";

import { useEffect, useState } from "react";
import SeasonalCalendar from "@/components/ecology/SeasonalCalendar";

type EcologyData = {
  calendar: Array<{ month: number; count: number; speciesCount: number }>;
  currentMonth: { species: string[] };
  sourceCount: number;
};

export default function NatureCompanion() {
  const [region, setRegion] = useState("Sénégal");
  const [data, setData] = useState<EcologyData | null>(null);
  useEffect(() => {
    fetch(`/api/ecology?region=${encodeURIComponent(region)}`).then((response) => response.ok ? response.json() : null).then((result) => { if (result) setData(result); }).catch(() => {});
  }, [region]);
  return <section className="mt-8" aria-label="Calendrier de biodiversité">
    <div className="mb-5"><span className="text-xs font-semibold tracking-[.18em] text-primary">OUTILS DE TERRAIN</span><h2 className="mt-1 font-serif text-2xl font-bold">Le vivant au fil des saisons</h2><p className="mt-1 text-sm text-foreground/60">Des repères construits à partir des observations publiques de la communauté.</p></div>
    <div className="grid grid-cols-1 gap-5"><SeasonalCalendar region={region} onRegionChange={setRegion} data={data}/></div>
  </section>;
}
