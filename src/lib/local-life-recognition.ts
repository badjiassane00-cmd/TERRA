export interface LocalLifePrediction {
  className: string;
  probability: number;
}

let modelPromise: Promise<import("@tensorflow-models/mobilenet").MobileNet> | null = null;

/** Runs image classification in the browser. The image is never uploaded. */
export async function recognizeLifeLocally(file: File): Promise<LocalLifePrediction[]> {
  const mobilenet = await import("@tensorflow-models/mobilenet");
  modelPromise ??= mobilenet.load({ version: 2, alpha: 1 });
  const model = await modelPromise;
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer cette photo pour l’analyse.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return model.classify(canvas, 5);
}
