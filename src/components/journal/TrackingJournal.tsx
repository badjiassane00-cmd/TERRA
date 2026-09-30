"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, Leaf, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

interface TimelineEntry {
  id: string;
  date: string;
  diseaseNames: string[];
  maxDiseaseConfidence: number;
  imageUrl: string | null;
}

interface PlantTimeline {
  plantId: string;
  scientificName: string;
  commonNames: string[];
  entries: TimelineEntry[];
}

interface TrackingJournalProps {
  userId: string;
}

// Compare la sévérité (maladie détectée + confiance) entre le premier
// et le dernier relevé pour donner une tendance en un coup d'œil :
// utile pour voir si un traitement fonctionne sans relire tout l'historique.
function trend(entries: TimelineEntry[]) {
  if (entries.length < 2) return "stable" as const;
  const first = entries[0].maxDiseaseConfidence;
  const last = entries[entries.length - 1].maxDiseaseConfidence;
  if (last < first - 0.1) return "improving" as const;
  if (last > first + 0.1) return "worsening" as const;
  return "stable" as const;
}

const trendMeta = {
  improving: { icon: TrendingDown, label: "En amélioration", color: "text-green-700 bg-green-50" },
  worsening: { icon: TrendingUp, label: "S'aggrave", color: "text-accent bg-accent/10" },
  stable: { icon: Minus, label: "Stable", color: "text-foreground/60 bg-primary/5" },
};

export default function TrackingJournal({ userId }: TrackingJournalProps) {
  const [timelines, setTimelines] = useState<PlantTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const loadTimeline = useCallback(async () => {
    if (!userId) return;
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/scan-history/timeline?userId=${userId}`, { signal: controller.signal });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTimelines(data.data || []);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Impossible de charger le carnet de suivi.");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadTimeline();
  }, [loadTimeline]);

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Carnet de suivi</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        L&apos;évolution de vos plantes scannées plusieurs fois : croissance, guérison, ou
        aggravation d&apos;une maladie détectée.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-foreground/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement du carnet...
        </div>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}

      {!isLoading && !error && timelines.length === 0 && (
        <p className="text-sm text-foreground/60 py-6 text-center">
          Pas encore de suivi disponible. Scannez une même plante à plusieurs reprises
          (par exemple avant/après un traitement) pour voir son évolution apparaître ici.
        </p>
      )}

      <div className="space-y-3">
        {timelines.map((timeline) => {
          const t = trend(timeline.entries);
          const TrendIcon = trendMeta[t].icon;
          const isOpen = openId === timeline.plantId;
          const commonName = timeline.commonNames?.[0] || timeline.scientificName;

          return (
            <div key={timeline.plantId} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : timeline.plantId)}
                className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{commonName}</p>
                  <p className="text-xs text-foreground/60 italic truncate">{timeline.scientificName}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${trendMeta[t].color}`}>
                  <TrendIcon className="w-3 h-3" />
                  {trendMeta[t].label}
                </span>
                <ChevronDown className={`w-4 h-4 text-foreground/40 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border bg-paper/50">
                      {timeline.entries.map((entry, index) => (
                        <div key={entry.id} className="flex items-center gap-3 py-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-foreground/70 flex-shrink-0">
                            {new Date(entry.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {entry.diseaseNames.length > 0 ? (
                            <span className="text-accent text-xs px-2 py-0.5 bg-accent/10 rounded-full truncate">
                              {entry.diseaseNames.join(", ")} ({Math.round(entry.maxDiseaseConfidence * 100)}%)
                            </span>
                          ) : (
                            <span className="text-green-700 text-xs px-2 py-0.5 bg-green-50 rounded-full">
                              Aucune maladie détectée
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
