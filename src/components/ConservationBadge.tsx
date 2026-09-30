"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

interface ConservationBadgeProps {
  scientificName: string;
}

interface ConservationData {
  available: boolean;
  code?: string;
  label?: string;
  severity?: number;
  url?: string;
}

// Couleurs par gravité : au-delà de "Vulnérable" (severity >= 2), on
// alerte visuellement — sous ce seuil, discret pour ne pas polluer la
// fiche d'une plante commune.
function severityStyle(severity: number) {
  if (severity >= 3) return "bg-accent/10 text-accent border-accent/30";
  if (severity >= 1) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-primary/5 text-foreground/60 border-border";
}

export default function ConservationBadge({ scientificName }: ConservationBadgeProps) {
  const [data, setData] = useState<ConservationData | null>(null);

  useEffect(() => {
    if (!scientificName) return;
    const controller = new AbortController();
    apiFetch(`/api/conservation-status?scientificName=${encodeURIComponent(scientificName)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
    return () => controller.abort();
  }, [scientificName]);

  // Rien à afficher si la donnée n'est pas disponible (pas de clé IUCN
  // configurée, espèce non trouvée...) — on ne veut pas d'un badge
  // "indisponible" qui alourdit la fiche pour rien.
  if (!data || !data.available) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${severityStyle(
        data.severity ?? -1
      )}`}
      title="Statut de conservation IUCN Red List"
    >
      <ShieldAlert className="w-3 h-3" />
      {data.label} ({data.code})
    </a>
  );
}
