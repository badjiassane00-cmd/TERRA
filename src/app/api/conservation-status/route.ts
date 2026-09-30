import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

// Statut de conservation IUCN Red List. Nécessite un token gratuit :
// s'inscrire sur https://api.iucnredlist.org/ (compte gratuit, usage
// non-commercial). Sans clé, la route répond "non disponible" plutôt
// que d'échouer, pour ne jamais bloquer l'affichage de la fiche plante.
//
// Note : l'API IUCN évolue régulièrement (v4 actuellement). Si le nom
// de l'endpoint ou la forme de la réponse a changé depuis l'écriture de
// cette route, ajuster ASSESSMENT_PATH et le parsing ci-dessous en
// conséquence — voir https://api.iucnredlist.org/api-docs pour la
// référence à jour.

const CATEGORY_LABELS: Record<string, { label: string; severity: number }> = {
  EX: { label: "Éteinte", severity: 5 },
  EW: { label: "Éteinte à l'état sauvage", severity: 5 },
  CR: { label: "En danger critique", severity: 4 },
  EN: { label: "En danger", severity: 3 },
  VU: { label: "Vulnérable", severity: 2 },
  NT: { label: "Quasi menacée", severity: 1 },
  LC: { label: "Préoccupation mineure", severity: 0 },
  DD: { label: "Données insuffisantes", severity: -1 },
  NE: { label: "Non évaluée", severity: -1 },
};
async function GETImpl(request: Request) {
  const { searchParams } = new URL(request.url);
  const scientificName = searchParams.get("scientificName");

  if (!scientificName) {
    return NextResponse.json({ error: "scientificName requis" }, { status: 400 });
  }

  const apiKey = process.env.IUCN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ available: false, reason: "no_api_key" });
  }

  try {
    const res = await fetch(
      `https://api.iucnredlist.org/api/v4/taxa/scientific_name/${encodeURIComponent(scientificName)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ available: false, reason: "species_not_found" });
    }
    if (!res.ok) throw new Error(`IUCN API ${res.status}`);

    const data = await res.json();
    // La forme exacte dépend de la version de l'API ; on tente
    // plusieurs chemins raisonnables plutôt que de supposer un seul format.
    const assessments = data?.taxon?.assessments || data?.assessments || [];
    const latest = assessments.find((a: { latest?: boolean }) => a.latest) || assessments[0];
    const code: string | undefined = latest?.red_list_category_code || latest?.category;

    if (!code) {
      return NextResponse.json({ available: false, reason: "no_assessment" });
    }

    const normalized = code.split("/")[0].toUpperCase(); // ex: "LR/lc" -> "LR" (ancien format)
    const meta = CATEGORY_LABELS[normalized] || CATEGORY_LABELS[code.toUpperCase()];

    return NextResponse.json({
      available: true,
      code,
      label: meta?.label || code,
      severity: meta?.severity ?? -1,
      url: latest?.url || `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}`,
    });
  } catch (error) {
    console.error("Erreur /api/conservation-status:", error);
    return NextResponse.json({ available: false, reason: "error" });
  }
}


export const GET = withApiErrors(GETImpl);
