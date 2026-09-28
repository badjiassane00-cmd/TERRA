import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";


export async function GET() {
  try {
    const count = await prisma.trainingData.count();
    const speciesCount = await prisma.trainingData.findMany({
      distinct: ["scientificName"],
      select: { scientificName: true },
    });
    const latestModel = await prisma.modelVersion.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      count,
      species: speciesCount.length,
      modelVersion: latestModel?.version || "v1.0.0",
      accuracy: latestModel?.accuracy || 0,
    });
  } catch (error) {
    console.error("Error fetching training stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch training stats" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const label = formData.get("label") as string;
    const scientificName = formData.get("scientificName") as string;
    const confidence = parseFloat(formData.get("confidence") as string || "0");

    if (!image || !label) {
      return NextResponse.json(
        { error: "Image and label are required" },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const trainingExample = await prisma.trainingData.create({
      data: {
        plantName: label,
        label,
        scientificName: scientificName || label,
        imageUrl: `data:${image.type};base64,${buffer.toString("base64")}`,
        confidence,
        isVerified: false,
        usedForTraining: false,
      },
    });

    return NextResponse.json(trainingExample);
  } catch (error) {
    console.error("Error adding training data:", error);
    return NextResponse.json(
      { error: "Failed to add training data" },
      { status: 500 }
    );
  }
}
