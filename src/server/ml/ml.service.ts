import { mlRepository } from "./ml.repository";

export const mlService = {
  listModels(limit: number) { return mlRepository.listModels(Math.min(Math.max(limit, 1), 50)); },
  trainingStats: () => mlRepository.trainingStats(),
  createModel(input: { version: string; name: string; description?: string; accuracy?: number; loss?: number; trainingDataCount: number; status?: "DRAFT" | "READY" | "TRAINING" | "DEPLOYED" | "ARCHIVED" }) {
    if (!input.version?.trim() || !input.name?.trim()) throw new Error("Une version et un nom sont requis.");
    if (!Number.isInteger(input.trainingDataCount) || input.trainingDataCount < 0) throw new Error("Nombre de données d’entraînement invalide.");
    return mlRepository.createModel(input);
  },
  addTrainingSample(input: { userId: string; label: string; scientificName: string; confidence: number; image: File }) {
    const bytesMax = 5 * 1024 * 1024;
    if (!input.image.type.match(/^image\/(jpeg|png|webp)$/) || input.image.size === 0 || input.image.size > bytesMax) throw new Error("Image invalide (JPEG, PNG ou WebP, 5 Mo maximum).");
    const label = input.label.trim();
    if (!label || label.length > 200) throw new Error("Le nom de l’espèce doit contenir entre 1 et 200 caractères.");
    const confidence = Number.isFinite(input.confidence) ? Math.max(0, Math.min(1, input.confidence)) : 0;
    return input.image.arrayBuffer().then((bytes) => mlRepository.addTrainingSample({
      userId: input.userId,
      plantName: label,
      scientificName: input.scientificName.trim().slice(0, 200) || label,
      imageUrl: `data:${input.image.type};base64,${Buffer.from(bytes).toString("base64")}`,
      label,
      confidence,
    }));
  },
};
