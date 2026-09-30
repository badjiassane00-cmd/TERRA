import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";

// Dictionnaire de secours utilisé uniquement si aucune clé IA n'est
// configurée, pour que l'assistant reste fonctionnel en dev sans clé.
const FALLBACK_KNOWLEDGE: Record<string, string> = {
  "quelle est cette plante": "Pour identifier une plante, utilisez le mode identification par photo dans la section principale. Notre IA analysera l'image et vous donnera le nom, les caractéristiques et les conseils d'entretien.",
  "comment arroser un baobab": "Le baobab nécessite un arrosage rare et espacé. Arrosez-le seulement lorsque le sol est complètement sec. En hiver, réduisez encore plus l'arrosage.",
  "quelles plantes médicinales": "De nombreuses régions du monde possèdent des plantes médicinales : le Baobab (vitamine C), l'Acacia (gomme arabique), le Neem, le Moringa, et bien d'autres. Consultez l'exposition régionale pour découvrir les plantes de votre zone.",
  "quand fleurit l'acacia": "L'Acacia senegal fleurit généralement de septembre à novembre, selon la région. Les fleurs sont jaunes et très parfumées.",
  "comment soigner l'oïdium": "L'oïdium est une maladie fongique. Traitez-la avec un fongicide approprié, du bicarbonate de potassium, ou en améliorant la circulation d'air autour de la plante.",
  "default": "Je suis votre assistant botanique. Posez-moi des questions sur les plantes, leur entretien, leurs maladies, ou utilisez le mode identification par photo pour une analyse détaillée.",
};

const SYSTEM_PROMPT = `Tu es l'assistant vocal de TERRA, une application d'identification et de diagnostic des plantes.
Réponds en français, en 2 à 4 phrases maximum, de façon claire et pratique (entretien, maladies, usages médicinaux/ornementaux/comestibles, floraison, toxicité).
Si l'utilisateur mentionne une plante précise et que tu la reconnais, termine ta réponse par une ligne séparée au format exact :
PLANTE: <nom usuel>
Sinon, n'ajoute pas cette ligne. Ne mentionne jamais que tu es un modèle de langage : reste dans le rôle de l'assistant botanique de l'application.`;

function fallbackAnswer(query: string) {
  const normalized = query.toLowerCase().trim();
  let response = FALLBACK_KNOWLEDGE.default;
  for (const [key, value] of Object.entries(FALLBACK_KNOWLEDGE)) {
    if (key !== "default" && normalized.includes(key)) {
      response = value;
      break;
    }
  }
  let plantName = "";
  if (normalized.includes("baobab")) plantName = "Baobab";
  else if (normalized.includes("acacia")) plantName = "Acacia";
  else if (normalized.includes("flamme") || normalized.includes("spathodea")) plantName = "Flamme de la forêt";
  else if (normalized.includes("olive")) plantName = "Olive africaine";

  return { response, plantName, speak: response.length < 200, source: "fallback" as const };
}

function extractPlantLine(rawText: string) {
  const plantMatch = rawText.match(/PLANTE:\s*(.+)\s*$/i);
  const plantName = plantMatch ? plantMatch[1].trim() : "";
  const response = plantMatch ? rawText.slice(0, plantMatch.index).trim() : rawText.trim();
  return { response, plantName };
}

// Option gratuite par défaut : Google Gemini (free tier sans carte
// bancaire — voir https://aistudio.google.com/apikey). Modèle
// surchargeable via GEMINI_MODEL si besoin.
async function askGemini(query: string, apiKey: string) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: query }] }],
      }),
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (!res.ok) throw new Error(`Gemini API ${res.status}`);
  const data = await res.json();
  const rawText: string = (data.candidates?.[0]?.content?.parts || [])
    .map((part: { text?: string }) => part.text || "")
    .join("\n")
    .trim();

  if (!rawText) throw new Error("Réponse Gemini vide");
  const { response, plantName } = extractPlantLine(rawText);
  return { response, plantName, speak: response.length < 400, source: "gemini" as const };
}

// Option de secours si vous préférez payer pour Claude plutôt que
// d'utiliser le free tier Gemini.
async function askClaude(query: string, apiKey: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const rawText: string = (data.content || [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n")
    .trim();

  const { response, plantName } = extractPlantLine(rawText);
  return { response, plantName, speak: response.length < 400, source: "claude" as const };
}
async function POSTImpl(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Requête vocale vide" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (geminiKey) {
      try {
        return NextResponse.json(await askGemini(query, geminiKey));
      } catch (err) {
        console.error("Assistant vocal : appel Gemini échoué.", err);
      }
    }

    if (anthropicKey) {
      try {
        return NextResponse.json(await askClaude(query, anthropicKey));
      } catch (err) {
        console.error("Assistant vocal : appel Anthropic échoué.", err);
      }
    }

    return NextResponse.json(fallbackAnswer(query));
  } catch (error) {
    console.error("Erreur assistant vocal:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement vocal" },
      { status: 500 }
    );
  }
}


export const POST = withApiErrors(POSTImpl);
