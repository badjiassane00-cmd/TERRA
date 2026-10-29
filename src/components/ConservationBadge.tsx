"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

interface ConservationBadgeProps {
  scientificName: string;
}

interface ConservationData {
  available: boolean;
  code?: string;
  label?: string;
  severity?: number;
  url?: string;
  reason?: string;
  scope?: string | null;
  yearPublished?: string | null;
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!scientificName) return;
    const controller = new AbortController();
    apiFetch(`/api/conservation-status?scientificName=${encodeURIComponent(scientificName)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const result = await res.json() as ConservationData;
        if (!res.ok && !result.reason) result.reason = "error";
        return result;
      })
      .then(setData)
      .catch(() => setData({ available: false, reason: "error" }));
    return () => controller.abort();
  }, [scientificName, retryCount]);

  if (!data) return <span className="text-xs text-foreground/55" role="status">Chargement du statut UICN…</span>;

  if (!data.available) {
    const message = data.reason === "no_api_key"
      ? "Statut UICN direct non configuré."
      : data.reason === "species_name_required"
        ? "Le statut UICN est consultable pour les noms d’espèces complets."
        : data.reason === "no_assessment" || data.reason === "species_not_found"
          ? "Aucune évaluation UICN trouvée pour ce nom."
          : "Service UICN temporairement indisponible.";
    return <span className="inline-flex flex-wrap items-center gap-2 text-xs text-foreground/60" role={data.reason === "error" ? "alert" : "status"}>
      {message}
      {data.reason === "error" && <button type="button" className="inline-flex min-h-9 items-center gap-1 text-primary underline underline-offset-2" onClick={() => setRetryCount((count) => count + 1)}><RefreshCw size={12} /> Réessayer</button>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Vérifier sur le site UICN</a>}
    </span>;
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${severityStyle(
        data.severity ?? -1
      )}`}
      title={`Statut UICN${data.scope ? ` · ${data.scope}` : ""}${data.yearPublished ? ` · évaluation ${data.yearPublished}` : ""}`}
      aria-label={`Statut UICN : ${data.label} (${data.code})${data.scope ? `, échelle ${data.scope}` : ""}${data.yearPublished ? `, année ${data.yearPublished}` : ""}`}
    >
      <ShieldAlert className="w-3 h-3" />
      {data.label} ({data.code})
    </a>
  );
}
