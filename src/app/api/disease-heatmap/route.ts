import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { observationRepository } from "@/server/observations/observation.repository";

// Regroupe les scans par cellule d'environ 5km pour anonymiser les
// positions individuelles (on ne veut pas exposer le domicile précis
// d'un utilisateur, seulement des foyers de maladies à l'échelle locale).
const GRID_SIZE = 0.05;

function cellKey(lat: number, lng: number) {
  const gLat = Math.round(lat / GRID_SIZE) * GRID_SIZE;
  const gLng = Math.round(lng / GRID_SIZE) * GRID_SIZE;
  return `${gLat.toFixed(3)},${gLng.toFixed(3)}`;
}

interface DiseaseEntry {
  disease?: string;
  confidence?: number;
}

interface ScanResult {
  scientific_name?: string;
  disease_detection?: DiseaseEntry[];
}
async function GETImpl(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") || "180");
    const since = new Date(Date.now() - days * 86400000);

    const scans = await observationRepository.findForDiseaseHeatmap(since);

    const cells = new Map<
      string,
      { lat: number; lng: number; count: number; diseases: Map<string, { count: number; maxConfidence: number }> }
    >();

    for (const scan of scans) {
      if (scan.lat == null || scan.lng == null) continue;
      const result = scan.result as ScanResult | null;
      const diseases = result?.disease_detection || [];
      if (diseases.length === 0) continue;

      const key = cellKey(scan.lat, scan.lng);
      if (!cells.has(key)) {
        const gLat = Math.round(scan.lat / GRID_SIZE) * GRID_SIZE;
        const gLng = Math.round(scan.lng / GRID_SIZE) * GRID_SIZE;
        cells.set(key, { lat: gLat, lng: gLng, count: 0, diseases: new Map() });
      }
      const cell = cells.get(key)!;
      cell.count += 1;

      for (const d of diseases) {
        const name = d.disease || "Maladie non identifiée";
        const confidence = d.confidence ?? 0;
        const existing = cell.diseases.get(name);
        if (existing) {
          existing.count += 1;
          existing.maxConfidence = Math.max(existing.maxConfidence, confidence);
        } else {
          cell.diseases.set(name, { count: 1, maxConfidence: confidence });
        }
      }
    }

    const points = Array.from(cells.values()).map((cell) => {
      const topDisease = Array.from(cell.diseases.entries()).sort((a, b) => b[1].count - a[1].count)[0];
      return {
        lat: cell.lat,
        lng: cell.lng,
        scanCount: cell.count,
        topDisease: topDisease?.[0] || null,
        topDiseaseCount: topDisease?.[1].count || 0,
        maxConfidence: topDisease?.[1].maxConfidence || 0,
        diseases: Array.from(cell.diseases.entries()).map(([name, v]) => ({
          name,
          count: v.count,
          maxConfidence: v.maxConfidence,
        })),
      };
    });

    return NextResponse.json({ points, totalScans: scans.length, windowDays: days });
  } catch (error) {
    console.error("Erreur disease-heatmap:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
