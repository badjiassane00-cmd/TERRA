"use client";

import { useEffect, useState, useRef } from "react";
import { CalendarDays, Droplets, Sun, Loader2 } from "lucide-react";

interface SahelCalendarProps {
  scientificName: string;
  watering?: string | null;
}

interface CalendarData {
  sowingMonths: number[];
  bloomingMonths: number[];
  harvestMonths: number[];
  watering: string | null;
  sunlight: string | null;
  hasSpecificData: boolean;
}

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Zonage saisonnier générique pour la bande sahélienne/soudanienne
// (Sénégal et voisins) : saison sèche longue, saison des pluies
// courte et concentrée — à l'opposé du calendrier tempéré par défaut
// qu'on trouve dans la plupart des applis de jardinage.
const RAINY_SEASON = [6, 7, 8, 9, 10]; // juin à octobre
const DRY_SEASON = [11, 12, 1, 2, 3, 4, 5];

function monthName(m: number) {
  return new Date(2024, m - 1, 1).toLocaleDateString("fr-FR", { month: "long" });
}

export default function SahelCalendar({ scientificName, watering }: SahelCalendarProps) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!scientificName) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetch(`/api/plants/calendar?scientificName=${encodeURIComponent(scientificName)}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [scientificName]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground/50 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calendrier de culture...
      </div>
    );
  }

  if (!data) return null;

  const renderMonthStrip = (activeMonths: number[], color: string) => (
    <div className="flex gap-0.5">
      {MONTH_LABELS.map((label, i) => {
        const month = i + 1;
        const active = activeMonths.includes(month);
        return (
          <div
            key={month}
            title={monthName(month)}
            className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] ${
              active ? `${color} text-white font-medium` : "bg-paper text-foreground/30"
            }`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mb-6 p-4 border border-border rounded-lg bg-paper/50">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium text-foreground">Calendrier de culture (Sahel)</h4>
      </div>

      {data.hasSpecificData ? (
        <div className="space-y-2">
          {data.sowingMonths.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground/60 w-16 flex-shrink-0">Semis</span>
              {renderMonthStrip(data.sowingMonths, "bg-primary-light")}
            </div>
          )}
          {data.bloomingMonths.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground/60 w-16 flex-shrink-0">Floraison</span>
              {renderMonthStrip(data.bloomingMonths, "bg-accent")}
            </div>
          )}
          {data.harvestMonths.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground/60 w-16 flex-shrink-0">Récolte</span>
              {renderMonthStrip(data.harvestMonths, "bg-primary")}
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-foreground/50 mb-3">
            Pas de calendrier spécifique renseigné pour cette espèce — repère saisonnier général
            pour la zone sahélienne/soudanienne :
          </p>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-foreground/60 w-24 flex-shrink-0">Saison des pluies</span>
            {renderMonthStrip(RAINY_SEASON, "bg-primary")}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/60 w-24 flex-shrink-0">Saison sèche</span>
            {renderMonthStrip(DRY_SEASON, "bg-accent/70")}
          </div>
          <p className="text-xs text-foreground/50 mt-3">
            {(watering || data.watering || "").toLowerCase().includes("peu") ||
            (watering || data.watering || "").toLowerCase().includes("rare")
              ? "Cette espèce tolère la sécheresse : semis en fin de saison des pluies pour un enracinement avant la saison sèche."
              : "Privilégiez le semis en début de saison des pluies (juin) pour profiter de l'humidité naturelle du sol."}
          </p>
        </>
      )}

      {(data.watering || data.sunlight) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          {data.watering && (
            <span className="flex items-center gap-1 text-xs text-foreground/60">
              <Droplets className="w-3.5 h-3.5 text-primary" /> {data.watering}
            </span>
          )}
          {data.sunlight && (
            <span className="flex items-center gap-1 text-xs text-foreground/60">
              <Sun className="w-3.5 h-3.5 text-accent" /> {data.sunlight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
