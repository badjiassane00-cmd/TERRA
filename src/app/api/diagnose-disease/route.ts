import { NextResponse } from "next/server";
import { ApiError, withApiErrors } from "@/server/http/api-handler";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CROPS: Record<string, string> = {
  Apple: "Pommier", Blueberry: "Myrtille", "Cherry_(including_sour)": "Cerisier",
  "Corn_(maize)": "Maïs", Grape: "Vigne", Orange: "Oranger", Peach: "Pêcher",
  "Pepper,_bell": "Poivron", Potato: "Pomme de terre", Raspberry: "Framboisier",
  Soybean: "Soja", Squash: "Courge", Strawberry: "Fraisier", Tomato: "Tomate",
};
const CONDITIONS: Record<string, string> = {
  Apple_scab: "Tavelure du pommier", Black_rot: "Pourriture noire", Cedar_apple_rust: "Rouille grillagée du pommier",
  healthy: "Classe saine", Powdery_mildew: "Oïdium", Cercospora_leaf_spot: "Tache grise (Cercospora)",
  "Gray_leaf_spot": "Tache grise", Common_rust: "Rouille commune", Northern_Leaf_Blight: "Helminthosporiose du maïs",
  Esca: "Esca de la vigne", Black_Measles: "Maladie des taches noires", Leaf_blight: "Brûlure foliaire",
  Isariopsis_Leaf_Spot: "Tache foliaire (Isariopsis)", Haunglongbing: "Huanglongbing (verdissement des agrumes)",
  Citrus_greening: "Verdissement des agrumes", Bacterial_spot: "Tache bactérienne", Early_blight: "Alternariose",
  Late_blight: "Mildiou", Leaf_Mold: "Moisissure foliaire", Septoria_leaf_spot: "Septoriose",
  "Spider_mites": "Acariens", Target_Spot: "Tache cible", Tomato_Yellow_Leaf_Curl_Virus: "Virus des feuilles jaunes en cuillère",
  Tomato_mosaic_virus: "Virus de la mosaïque de la tomate", Leaf_scorch: "Brûlure foliaire",
};
function readableCondition(label: string): string {
  const cleaned = label.replace(/___/g, "_").replace(/[()]/g, "_").replace(/[^A-Za-z0-9,_ ]/g, "_");
  const parts = cleaned.split("_").filter(Boolean);
  for (let i = 1; i < parts.length; i++) {
    const key = parts.slice(i).join("_");
    if (CONDITIONS[key]) return CONDITIONS[key];
  }
  return parts.slice(1).join(" ").replaceAll("_", " ") || "État foliaire non précisé";
}
function cropName(label: string): string {
  const crop = label.split("___")[0] || "Culture";
  return CROPS[crop] || crop.replaceAll("_", " ");
}

async function POSTImpl(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof File)) throw new ApiError("Ajoutez une photo de feuille.", 400);
  if (!ACCEPTED_TYPES.has(image.type)) throw new ApiError("Utilisez une image JPEG, PNG ou WebP.", 415);
  if (!image.size || image.size > MAX_IMAGE_BYTES) throw new ApiError("L’image doit peser au maximum 10 Mo.", 413);
  const baseUrl = (process.env.DISEASE_MODEL_URL || "http://127.0.0.1:8010").replace(/\/$/, "");
  const payload = new FormData();
  payload.append("image", image, image.name || "plant.jpg");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/identify`, { method: "POST", body: payload, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new ApiError("Le modèle PlantVillage est indisponible. Démarrez le service de diagnostic des plantes.", 503);
  }
  if (!response.ok) throw new ApiError("Le service PlantVillage n’a pas pu analyser cette image.", response.status >= 500 ? 503 : response.status);
  const body = await response.json() as { provider?: string; candidates?: Array<{ className: string; score: number }> };
  const candidates = (body.candidates || []).filter((entry) => typeof entry.className === "string" && Number.isFinite(entry.score));
  const best = candidates[0];
  if (!best) throw new ApiError("Aucune classe du modèle n’a été retournée.", 502);
  const crop = cropName(best.className);
  const condition = readableCondition(best.className);
  const healthy = /healthy/i.test(best.className);
  const alternatives = candidates.slice(1).map((candidate) => ({
    scientific_name: `${cropName(candidate.className)} — ${readableCondition(candidate.className)}`,
    common_names: [readableCondition(candidate.className)], probability: candidate.score,
  }));
  return NextResponse.json({
    provider: body.provider || "PlantVillage EfficientNet-B4",
    result: {
      id: best.className,
      scientific_name: `${crop} — ${condition}`,
      common_names: [crop], probability: best.score,
      description: "Suggestion du modèle open source EfficientNet-B4 entraîné sur PlantVillage. Son jeu de données couvre 14 cultures et 38 classes d’images contrôlées ; les résultats en conditions de terrain peuvent différer.",
      taxonomy: { kingdom: "Plantae" },
      disease_detection: [{
        disease: healthy ? `${crop} — classe saine` : `${crop} — ${condition}`,
        confidence: best.score,
        description: healthy ? "La meilleure correspondance est une image classée comme saine par le modèle. Cela ne garantit pas l’absence de maladie." : "Correspondance visuelle suggérée par le modèle ; à confirmer par un spécialiste avant toute intervention.",
        treatment: [],
      }],
      alternatives,
      sources: { provider: body.provider || "PlantVillage EfficientNet-B4" },
    },
  });
}

export const POST = withApiErrors(POSTImpl);
