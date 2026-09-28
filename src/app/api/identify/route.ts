import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { enrichWithGbif, normalizeDiseases, normalizePlantNet, type Identification } from "@/lib/botany";
import { getSessionUserId } from "../../../lib/session";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const mode = formData.get("mode") === "disease" ? "disease" : "identify";
    const userId = await getSessionUserId();
    const sessionId = typeof formData.get("sessionId") === "string" && formData.get("sessionId") ? String(formData.get("sessionId")) : null;
    const latRaw = formData.get("lat");
    const lngRaw = formData.get("lng");
    const lat = typeof latRaw === "string" && latRaw !== "" ? Number(latRaw) : null;
    const lng = typeof lngRaw === "string" && lngRaw !== "" ? Number(lngRaw) : null;
    const hasCoords = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);

    if (!(image instanceof File)) return NextResponse.json({ error: "Ajoutez une photo de plante." }, { status: 400 });
    if (!ACCEPTED_TYPES.has(image.type)) return NextResponse.json({ error: "Utilisez une image JPEG ou PNG." }, { status: 415 });
    if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "L'image ne doit pas dépasser 10 Mo." }, { status: 413 });

    const apiKey = process.env.PLANTNET_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Configuration requise : ajoutez PLANTNET_API_KEY dans .env.local. La clé reste côté serveur." }, { status: 503 });

    const createProviderForm = () => {
      const providerForm = new FormData();
      providerForm.append("images", image, image.name);
      providerForm.append("organs", "auto");
      return providerForm;
    };
    const base = "https://my-api.plantnet.org/v2";
    const endpoint = mode === "disease" ? `${base}/diseases/identify` : `${base}/identify/all`;
    const response = await fetch(`${endpoint}?api-key=${encodeURIComponent(apiKey)}&lang=fr`, { method: "POST", body: createProviderForm(), signal: AbortSignal.timeout(30_000) });
    const raw = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ error: raw?.message || `Le service de reconnaissance a répondu ${response.status}.` }, { status: response.status });

    let result: Identification;
    if (mode === "disease") {
      const plantResponse = await fetch(`${base}/identify/all?api-key=${encodeURIComponent(apiKey)}&lang=fr`, { method: "POST", body: createProviderForm(), signal: AbortSignal.timeout(30_000) });
      const plantRaw = await plantResponse.json().catch(() => null);
      if (!plantResponse.ok) return NextResponse.json({ error: "La maladie a été analysée, mais la plante n'a pas pu être identifiée." }, { status: 502 });
      result = normalizePlantNet(plantRaw);
      result.disease_detection = normalizeDiseases(raw);
    } else result = normalizePlantNet(raw);

    result = await enrichWithGbif(result);
    if (userId) await saveScan(userId, result, hasCoords ? lat : null, hasCoords ? lng : null, sessionId);
    return NextResponse.json({ result, mode, provider: "plantnet", quota: raw?.remainingIdentificationRequests });
  } catch (error) {
    console.error("Identification failed", error);
    return NextResponse.json({ error: "Impossible d'analyser la photo pour le moment. Réessayez avec une photo nette." }, { status: 500 });
  }
}

async function saveScan(userId: string, result: Identification, lat: number | null, lng: number | null, sessionId: string | null) {
  const plant = await prisma.plant.upsert({
    where: { scientificName: result.scientific_name },
    update: {
      commonNames: JSON.stringify(result.common_names),
      kingdom: result.taxonomy?.kingdom,
      phylum: result.taxonomy?.phylum,
      taxClass: result.taxonomy?.class,
      order: result.taxonomy?.order,
      family: result.taxonomy?.family,
      genus: result.taxonomy?.genus,
      species: result.taxonomy?.species,
      taxonomy: JSON.stringify(result.taxonomy),
      gbifId: result.sources.gbif?.split("/").pop(),
    },
    create: {
      scientificName: result.scientific_name,
      commonNames: JSON.stringify(result.common_names),
      kingdom: result.taxonomy?.kingdom,
      phylum: result.taxonomy?.phylum,
      taxClass: result.taxonomy?.class,
      order: result.taxonomy?.order,
      family: result.taxonomy?.family,
      genus: result.taxonomy?.genus,
      species: result.taxonomy?.species,
      taxonomy: JSON.stringify(result.taxonomy),
      gbifId: result.sources.gbif?.split("/").pop(),
    },
  });
  await prisma.scanHistory.create({ data: { userId, plantId: plant.id, result: result as object, lat, lng, sessionId } });
}
