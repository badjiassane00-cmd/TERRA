import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { buildIucnTaxonSearchUrl, selectIucnAssessment } from "@/lib/iucn-assessment";
import { enforceRateLimit } from "@/server/http/rate-limit";

// Statut de conservation IUCN Red List. Nécessite un token gratuit :
// s'inscrire sur https://api.iucnredlist.org/ (compte gratuit, usage
// non-commercial). Sans clé, la route répond "non disponible" plutôt
// que d'échouer, pour ne jamais bloquer l'affichage de la fiche plante.
//
// L'API v4 recherche les évaluations par genus_name et species_name.
// La clé reste côté serveur et les erreurs de fournisseur ne bloquent
// pas l'affichage du résultat d'identification.

async function GETImpl(request: Request) {
  const { searchParams } = new URL(request.url);
  const scientificName = searchParams.get("scientificName");

  if (!scientificName) {
    return NextResponse.json({ error: "scientificName requis" }, { status: 400 });
  }
  if (scientificName.length > 200) return NextResponse.json({ error: "Nom scientifique trop long." }, { status: 400 });

  const url = buildIucnTaxonSearchUrl(scientificName);
  if (!url) return NextResponse.json({ available: false, reason: "species_name_required" });

  const apiKey = process.env.IUCN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ available: false, reason: "no_api_key", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}` });
  }

  const limited = await enforceRateLimit(request, "conservation-status", { limit: 6, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (res.status === 404) {
      return NextResponse.json({ available: false, reason: "species_not_found", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}` });
    }
    if (res.status === 429) {
      return NextResponse.json({ available: false, reason: "error", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}` }, { status: 503, headers: { "Retry-After": res.headers.get("retry-after") || "60" } });
    }
    if (!res.ok) throw new Error(`IUCN API ${res.status}`);

    const assessment = selectIucnAssessment(await res.json());
    if (!assessment) {
      return NextResponse.json({ available: false, reason: "no_assessment", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}` });
    }
    return NextResponse.json({
      available: true,
      code: assessment.code,
      label: assessment.label,
      severity: assessment.severity,
      scope: assessment.scope,
      assessmentDate: assessment.assessmentDate,
      yearPublished: assessment.yearPublished,
      url: assessment.url || `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}`,
    });
  } catch (error) {
    console.error("Erreur /api/conservation-status:", error);
    return NextResponse.json({ available: false, reason: "error", url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(scientificName)}` });
  }
}


export const GET = withApiErrors(GETImpl);
