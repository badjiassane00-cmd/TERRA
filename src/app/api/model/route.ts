import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { requireModerator } from "@/lib/moderation";
import { mlService } from "@/server/ml/ml.service";
async function POSTImpl(request: Request) {
  const moderator = await requireModerator(await getSessionUserId());
  if (!moderator) return NextResponse.json({ error: "Réservé aux comptes institution" }, { status: 403 });
  try {
    const body = await request.json();
    const modelVersion = await mlService.createModel({
      version: typeof body.version === "string" ? body.version : "",
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : undefined,
      accuracy: Number.isFinite(body.accuracy) ? body.accuracy : undefined,
      loss: Number.isFinite(body.loss) ? body.loss : undefined,
      trainingDataCount: Number(body.trainingDataCount),
      status: ["DRAFT", "READY", "TRAINING", "DEPLOYED", "ARCHIVED"].includes(body.status) ? body.status : "READY",
    });
    return NextResponse.json(modelVersion);
  } catch (error) {
    console.error("Error creating model version:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create model version" }, { status: 400 });
  }
}


export const POST = withApiErrors(POSTImpl);

async function GETImpl(request: Request) {
  try {
    const limit = Number.parseInt(new URL(request.url).searchParams.get("limit") || "10", 10);
    return NextResponse.json(await mlService.listModels(Number.isFinite(limit) ? limit : 10));
  } catch (error) {
    console.error("Error fetching model versions:", error);
    return NextResponse.json({ error: "Failed to fetch model versions" }, { status: 500 });
  }
}


export const GET = withApiErrors(GETImpl);
