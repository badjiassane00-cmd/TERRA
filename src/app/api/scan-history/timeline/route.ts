import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { scanHistoryRepository } from "@/server/scan-history/scan-history.repository";
import { getSessionUserId } from "../../../../lib/session";

interface DiseaseEntry {
  disease?: string;
  confidence?: number;
}

interface ScanResult {
  scientific_name?: string;
  common_names?: string[];
  disease_detection?: DiseaseEntry[];
}

// Regroupe les scans d'un même utilisateur par plante pour construire
// un carnet de suivi : évolution de la confiance d'identification et
// des maladies détectées dans le temps pour une même espèce.
async function GETImpl() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const scans = await scanHistoryRepository.timelineForUser(userId);

    const groups = new Map<
      string,
      {
        plantId: string;
        scientificName: string;
        commonNames: string[];
        entries: Array<{
          id: string;
          date: string;
          diseaseNames: string[];
          maxDiseaseConfidence: number;
          imageUrl: string | null;
        }>;
      }
    >();

    for (const scan of scans) {
      if (!scan.plantId || !scan.plant) continue;
      const result = scan.result as ScanResult | null;
      const diseases = result?.disease_detection || [];

      if (!groups.has(scan.plantId)) {
        groups.set(scan.plantId, {
          plantId: scan.plantId,
          scientificName: scan.plant.scientificName,
          commonNames: JSON.parse(scan.plant.commonNames || "[]"),
          entries: [],
        });
      }

      groups.get(scan.plantId)!.entries.push({
        id: scan.id,
        date: scan.createdAt.toISOString(),
        diseaseNames: diseases.map((d) => d.disease || "").filter(Boolean),
        maxDiseaseConfidence: diseases.reduce((max, d) => Math.max(max, d.confidence ?? 0), 0),
        imageUrl: scan.imageUrl,
      });
    }

    // Un "suivi" n'a de sens qu'à partir de 2 scans de la même plante.
    const timelines = Array.from(groups.values()).filter((g) => g.entries.length >= 2);

    return NextResponse.json({ count: timelines.length, data: timelines });
  } catch (error) {
    console.error("Erreur timeline:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
