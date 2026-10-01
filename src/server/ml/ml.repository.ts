import { prisma } from "@/lib/prisma";

export const mlRepository = {
  createModel(input: { version: string; name: string; description?: string | null; accuracy?: number | null; loss?: number | null; trainingDataCount: number; status?: "DRAFT" | "READY" | "TRAINING" | "DEPLOYED" | "ARCHIVED" }) {
    return prisma.modelVersion.create({ data: { ...input, status: input.status || "READY" } });
  },
  listModels(limit: number) { return prisma.modelVersion.findMany({ orderBy: { createdAt: "desc" }, take: limit }); },
  async trainingStats() {
    const [count, species, latestModel] = await Promise.all([
      prisma.trainingData.count(),
      prisma.trainingData.findMany({ distinct: ["scientificName"], select: { scientificName: true } }),
      prisma.modelVersion.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);
    return { count, species: species.length, modelVersion: latestModel?.version || "Aucun modèle publié", accuracy: latestModel?.accuracy || 0 };
  },
  addTrainingSample(input: { userId: string; plantName: string; scientificName: string; imageUrl: string; label: string; confidence: number }) {
    return prisma.trainingData.create({ data: { ...input, isVerified: false, usedForTraining: false } });
  },
};
