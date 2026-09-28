"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { AlertTriangle, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface HeatPoint {
  lat: number;
  lng: number;
  scanCount: number;
  topDisease: string | null;
  topDiseaseCount: number;
  maxConfidence: number;
  diseases: Array<{ name: string; count: number; maxConfidence: number }>;
}

interface DiseaseHeatmapProps {
  center?: { lat: number; lng: number };
  windowDays?: number;
}

// Rayon et couleur du cercle en fonction de la sévérité (nombre de
// signalements + confiance maximale de détection).
function severityStyle(point: HeatPoint) {
  const severity = point.topDiseaseCount * (0.5 + point.maxConfidence);
  const radius = Math.min(10 + severity * 6, 42);
  const color =
    severity > 3 ? "#b5652d" : severity > 1.2 ? "#c98a4b" : "#8fa87e";
  return { radius, color };
}

export default function DiseaseHeatmap({
  center = { lat: 14.6928, lng: -17.4467 }, // Dakar par défaut
  windowDays = 180,
}: DiseaseHeatmapProps) {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalScans, setTotalScans] = useState(0);
  const isInitialMount = useRef(true);

  const loadHeatmap = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/disease-heatmap?days=${windowDays}`, { signal: controller.signal });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPoints(data.points || []);
      setTotalScans(data.totalScans || 0);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Impossible de charger les foyers de maladies.");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [windowDays]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadHeatmap();
  }, [loadHeatmap]);

  return (
    <div className="botanical-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" strokeWidth={1.5} />
          <h3 className="font-display text-lg text-foreground">Foyers de maladies signalés</h3>
        </div>
        {!isLoading && (
          <span className="text-xs text-foreground/60">
            {totalScans} scan{totalScans > 1 ? "s" : ""} géolocalisé{totalScans > 1 ? "s" : ""} — {windowDays} derniers jours
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96 gap-2 text-foreground/60">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement des données terrain...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-96 text-accent text-sm">{error}</div>
      ) : points.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 gap-2 text-center px-6">
          <p className="text-foreground/70 font-medium">Aucun foyer détecté pour le moment</p>
          <p className="text-sm text-foreground/50 max-w-sm">
            Cette carte se remplit au fil des scans géolocalisés en mode diagnostic. Activez le partage de position lors d&apos;une identification pour contribuer.
          </p>
        </div>
      ) : (
        <MapContainer center={[center.lat, center.lng]} zoom={7} style={{ height: "384px", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((point, i) => {
            const { radius, color } = severityStyle(point);
            return (
              <CircleMarker
                key={i}
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.45, weight: 1 }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{point.topDisease || "Signalements multiples"}</p>
                    <p className="text-foreground/70 mt-1">
                      {point.topDiseaseCount} signalement{point.topDiseaseCount > 1 ? "s" : ""} ·{" "}
                      confiance max {Math.round(point.maxConfidence * 100)}%
                    </p>
                    {point.diseases.length > 1 && (
                      <ul className="mt-2 text-xs text-foreground/60 list-disc list-inside">
                        {point.diseases.slice(0, 4).map((d) => (
                          <li key={d.name}>
                            {d.name} ({d.count})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
