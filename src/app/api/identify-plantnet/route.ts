import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { plantRepository } from "@/server/plants/plant.repository";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedFormData } from "@/server/http/read-limited-form-data";

interface PlantNetSpecies {
  name?: string;
  scientificName?: string;
}

interface PlantNetResult {
  species?: PlantNetSpecies;
  [key: string]: unknown;
}

const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY || "";
const PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all";
async function POSTImpl(request: Request) {
  try {
    const limited = await enforceRateLimit(request, "identify-plantnet", { limit: 12, windowMs: 60_000 });
    if (limited) return limited;
    const formData = await readLimitedFormData(request, 11 * 1024 * 1024);
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    if (!PLANTNET_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Pl@ntNet non configurée" },
        { status: 500 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const plantnetFormData = new FormData();
    plantnetFormData.append("images", new Blob([buffer], { type: image.type }), image.name);
    plantnetFormData.append("organs", "auto");

    const response = await fetch(`${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}`, {
      method: "POST",
      body: plantnetFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pl@ntNet API error:", errorText);
      return NextResponse.json(
        { error: `Erreur API Pl@ntNet: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const enrichedResults = await Promise.all(
      (data.results || []).slice(0, 10).map(async (result: PlantNetResult) => {
        const speciesName = result.species?.name || result.species?.scientificName;
        if (!speciesName) return result;

        const existingPlant = await plantRepository.findForEnrichment(speciesName);

        return {
          ...result,
          enrichedData: existingPlant || null,
        };
      })
    );

    return NextResponse.json({
      source: "plantnet",
      count: enrichedResults.length,
      results: enrichedResults,
    });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erreur Pl@ntNet:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'identification Pl@ntNet" },
      { status: 500 }
    );
  }
}


export const POST = withApiErrors(POSTImpl);
