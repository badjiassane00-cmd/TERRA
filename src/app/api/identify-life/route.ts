import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";
type LocalPrediction = { className: string; probability: number };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const predictions = Array.isArray(body.predictions) ? body.predictions.slice(0, 5) as LocalPrediction[] : [];
    if (!predictions.length || predictions.some((item) => typeof item.className !== "string" || item.className.length > 180 || !Number.isFinite(item.probability))) {
      return NextResponse.json({ error: "Aucune prédiction locale valide n’a été reçue." }, { status: 400 });
    }
    const candidates = await Promise.all(predictions.map(async (prediction) => {
      const latinName = prediction.className.match(/\b[A-Z][a-z-]+\s+[a-z-]+\b/)?.[0];
      const displayName = prediction.className.split(",")[0].trim();
      const query = latinName || displayName;
      const response = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json", "User-Agent": "SunuNature/1.0" }, signal: AbortSignal.timeout(7_000),
      }).catch(() => null);
      const match = response?.ok ? await response.json().catch(() => null) : null;
      const scientificName = match?.scientificName || match?.canonicalName || query;
      const taxonKey = match?.usageKey || match?.key;
      let commonNames = [displayName];
      if (taxonKey) {
        const namesResponse = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/vernacularNames`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5_000) }).catch(() => null);
        const names = namesResponse?.ok ? await namesResponse.json().catch(() => []) : [];
        const preferred = Array.isArray(names) ? names.find((name: { language?: string }) => ["fra", "fr"].includes(name.language?.toLowerCase() || "")) || names.find((name: { language?: string }) => ["eng", "en"].includes(name.language?.toLowerCase() || "")) : null;
        if (preferred?.vernacularName && !commonNames.includes(preferred.vernacularName)) commonNames = [preferred.vernacularName, ...commonNames];
      }
      const result = {
        id: scientificName, scientific_name: scientificName, common_names: commonNames,
        probability: Math.max(0, Math.min(1, prediction.probability)),
        taxonomy: { kingdom: match?.kingdom, phylum: match?.phylum, class: match?.class, order: match?.order, family: match?.family, genus: match?.genus, species: match?.species },
        description: "Suggestion visuelle générée sur votre appareil. Le nom scientifique est rapproché du référentiel taxonomique GBIF.",
        sources: { provider: "MobileNet sur l’appareil", ...(taxonKey ? { gbif: `https://www.gbif.org/species/${taxonKey}` } : {}) },
      };
      return { ...result, matchType: match?.matchType || null };
    }));
    const result = candidates[0];
    const userId = await getSessionUserId();
    if (userId) await prisma.scanHistory.create({ data: { userId, result: result as object } });
    return NextResponse.json({ result, candidates, provider: "MobileNet + GBIF", imageSent: false, note: "Les suggestions visuelles sont approximatives et doivent être vérifiées." });
  } catch (error) {
    console.error("Local organism identification enrichment failed", error);
    return NextResponse.json({ error: "Impossible d’enrichir ces suggestions taxonomiques." }, { status: 500 });
  }
}
