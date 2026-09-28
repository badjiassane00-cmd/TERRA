import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { observationRepository } from "@/server/observations/observation.repository";
import { publicCoordinates } from "@/server/observations/location";
import { inaturalistService } from "@/server/inaturalist/inaturalist.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const observation = await observationRepository.findById(id);
    if (!observation) {
      if (/^\d+$/.test(id)) {
        try {
          const externalObservation = await inaturalistService.findById(id);
          if (externalObservation) return NextResponse.json({ source: "iNaturalist", observation: externalObservation });
        } catch { /* Public source temporarily unavailable. */ }
      }
      return NextResponse.json({ error: "Observation introuvable." }, { status: 404 });
    }
    const viewerId = await getSessionUserId();
    return NextResponse.json({ observation: { ...observation, ...publicCoordinates(observation, viewerId) } });
  } catch (error) {
    console.error("Erreur détail observation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
