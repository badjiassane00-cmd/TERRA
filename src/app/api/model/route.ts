import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { version, name, description, accuracy, loss, trainingDataCount, status } = body;

    const modelVersion = await prisma.modelVersion.create({
      data: {
        version,
        name,
        description,
        accuracy,
        loss,
        trainingDataCount,
        status: status || "READY",
      },
    });

    return NextResponse.json(modelVersion);
  } catch (error) {
    console.error("Error creating model version:", error);
    return NextResponse.json(
      { error: "Failed to create model version" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const models = await prisma.modelVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching model versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch model versions" },
      { status: 500 }
    );
  }
}
