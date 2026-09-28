"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Compass, ExternalLink, MapPin, Users } from "lucide-react";

type Sighting = { id: number; observedOn: string; observer: string; place: string; photo: string | null; url: string };

export default function NearbySightings({ scientificName, location }: { scientificName?: string; location: { lat: number; lng: number } | null }) {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const isInitialMount = useRef(true);

  const loadSightings = useCallback(async () => {
    if (!scientificName || !location) return;
    const controller = new AbortController();
    setState("loading");
    try {
      const params = new URLSearchParams({ scientificName, lat: String(location.lat), lng: String(location.lng) });
      const response = await fetch(`/api/observations?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSightings(data.sightings || []);
      setTotal(data.total ?? 0);
      setState("idle");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setState("error");
    }
  }, [scientificName, location?.lat, location?.lng]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadSightings();
  }, [loadSightings]);

  if (!scientificName || !location) return null;
  return (
    <section className="herbarium-card rounded-xl p-6 mt-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Compass className="w-5 h-5 text-primary" /></div>
        <div><h3 className="font-serif font-semibold">Présence autour de vous</h3><p className="text-xs text-foreground/60">Observations de recherche iNaturalist, rayon de 50 km</p></div>
      </div>
      {state === "loading" && <p className="text-sm text-foreground/60">Recherche des observations terrain…</p>}
      {state === "error" && <p className="text-sm text-terracotta">Impossible de charger les observations actuellement.</p>}
      {state === "idle" && total === 0 && <p className="text-sm text-foreground/60">Aucune observation validée à proximité. Cela ne signifie pas que l’espèce est absente.</p>}
      {state === "idle" && sightings.length > 0 && <>
        <p className="text-sm text-primary mb-3 flex gap-2 items-center"><Users className="w-4 h-4" /> {total} observation(s) validée(s)</p>
        <div className="grid grid-cols-2 gap-3">
          {sightings.slice(0, 4).map((sighting) => <a key={sighting.id} href={sighting.url} target="_blank" rel="noreferrer" className="border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
            {sighting.photo && <img src={sighting.photo} alt="Observation iNaturalist" className="w-full h-24 object-cover" />}
            <div className="p-2"><p className="text-xs font-medium truncate">{sighting.observer}</p><p className="text-xs text-foreground/60 truncate flex gap-1"><MapPin className="w-3 h-3 shrink-0" />{sighting.place}</p><p className="text-xs text-primary mt-1 flex gap-1">Voir <ExternalLink className="w-3 h-3" /></p></div>
          </a>)}
        </div>
      </>}
    </section>
  );
}
