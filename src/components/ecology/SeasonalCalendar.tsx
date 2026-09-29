"use client";

import { CalendarDays } from "lucide-react";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
type CalendarData = { calendar: Array<{ month: number; count: number; speciesCount: number }>; currentMonth: { species: string[] }; sourceCount: number };

export default function SeasonalCalendar({ region, onRegionChange, data }: { region: string; onRegionChange: (region: string) => void; data: CalendarData | null }) {
  const currentMonth = new Date().getMonth();
  return <article className="herbarium-card rounded-2xl p-5">
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary"/><h3 className="font-serif text-lg font-semibold">Calendrier vivant</h3></div>
      <select aria-label="Région du calendrier" value={region} onChange={(event) => onRegionChange(event.target.value)} className="herbarium-input max-w-36 text-xs">
        {["Sénégal", "Mali", "Ghana", "Côte d’Ivoire", "Burkina Faso", "Bénin", "Kenya", "Cameroun", "Afrique du Sud"].map((name) => <option key={name}>{name}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
      {(data?.calendar || MONTHS.map((_, index) => ({ month: index + 1, count: 0, speciesCount: 0 }))).map((month) => {
        const max = Math.max(1, ...(data?.calendar.map((item) => item.count) || [1]));
        return <div key={month.month} title={`${MONTHS[month.month - 1]} · ${month.count} observations · ${month.speciesCount} espèces`} className={`rounded-lg border p-2 text-center ${month.month - 1 === currentMonth ? "border-primary bg-primary/10" : "border-border bg-paper"}`}>
          <span className="block text-[11px] text-foreground/60">{MONTHS[month.month - 1]}</span><span className="mx-auto mt-1 block h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(16, month.count / max * 100)}%`, opacity: month.count ? 1 : 0.2 }}/><span className="mt-1 block text-xs font-semibold">{month.count}</span>
        </div>;
      })}
    </div>
    <p className="mt-4 text-xs text-foreground/60">{data ? `${data.sourceCount} observations publiques analysées au ${region} sur 24 mois. Ces chiffres montrent l’activité de partage, pas une prévision de présence.` : "Chargement des observations…"}</p>
    {data?.currentMonth.species.length ? <p className="mt-3 text-sm"><strong>Espèces partagées ce mois-ci :</strong> {data.currentMonth.species.join(", ")}</p> : null}
  </article>;
}
