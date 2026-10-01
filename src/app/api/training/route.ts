import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { mlService } from "@/server/ml/ml.service";
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
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 7 * 1024 * 1024) return NextResponse.json({ error: "L’envoi dépasse la taille autorisée." }, { status: 413 });
    const formData = await request.formData();
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
    console.error("Error adding training data:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add training data" }, { status: 400 });
  }
}


export const POST = withApiErrors(POSTImpl);
