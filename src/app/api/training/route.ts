import { ApiError, withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { mlService } from "@/server/ml/ml.service";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { readLimitedFormData } from "@/server/http/read-limited-form-data";
async function GETImpl() {
  try {
    return NextResponse.json(await mlService.trainingStats());
  } catch (error) {
    console.error("Error fetching training stats:", error);
    return NextResponse.json({ error: "Failed to fetch training stats" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);

async function POSTImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour contribuer au jeu de données." }, { status: 401 });
  const limited = await enforceRateLimit(request, "training-submit", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const formData = await readLimitedFormData(request, 7 * 1024 * 1024);
    const image = formData.get("image");
    const label = formData.get("label");
    if (!(image instanceof File) || typeof label !== "string") return NextResponse.json({ error: "Image and label are required" }, { status: 400 });
    const trainingExample = await mlService.addTrainingSample({
      userId,
      image,
      label,
      scientificName: String(formData.get("scientificName") || label),
      confidence: Number(formData.get("confidence") || 0),
    });
    return NextResponse.json(trainingExample, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error adding training data:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add training data" }, { status: 400 });
  }
}


export const POST = withApiErrors(POSTImpl);
