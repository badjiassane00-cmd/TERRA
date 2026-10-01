export interface ObservationPhotos { imageUrl: string; thumbnailUrl: string }

export function photoLicenseUrl(code: string) {
  const license = code.toLowerCase();
  if (license === "cc0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  if (license === "cc-by-sa") return "https://creativecommons.org/licenses/by-sa/4.0/";
  return "https://creativecommons.org/licenses/by/4.0/";
}

async function canvasDataUrl(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Impossible de préparer la photo.");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture de photo impossible."));
    reader.onerror = () => reject(new Error("Lecture de photo impossible."));
    reader.readAsDataURL(blob);
  });
}

export async function compressObservationPhoto(file: File): Promise<ObservationPhotos> {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez une photo au format JPEG, PNG ou WebP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("La photo originale ne doit pas dépasser 15 Mo.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer la photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let fullCanvas = canvas;
  let fullPhoto = await canvasDataUrl(fullCanvas, 0.72);
  if (fullPhoto.length > 1_200_000) {
    const smaller = document.createElement("canvas");
    smaller.width = Math.round(canvas.width * 0.72);
    smaller.height = Math.round(canvas.height * 0.72);
    smaller.getContext("2d")?.drawImage(canvas, 0, 0, smaller.width, smaller.height);
    fullCanvas = smaller;
    fullPhoto = await canvasDataUrl(fullCanvas, 0.61);
  }
  if (fullPhoto.length > 1_200_000) throw new Error("La photo reste trop lourde après compression. Choisissez une autre image.");
  const thumbnail = document.createElement("canvas");
  const thumbnailScale = Math.min(1, 480 / Math.max(fullCanvas.width, fullCanvas.height));
  thumbnail.width = Math.max(1, Math.round(fullCanvas.width * thumbnailScale));
  thumbnail.height = Math.max(1, Math.round(fullCanvas.height * thumbnailScale));
  thumbnail.getContext("2d")?.drawImage(fullCanvas, 0, 0, thumbnail.width, thumbnail.height);
  return { imageUrl: fullPhoto, thumbnailUrl: await canvasDataUrl(thumbnail, 0.58) };
}

export async function createVideoPoster(file: File): Promise<ObservationPhotos> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Impossible de lire cette vidéo."));
    });
    video.currentTime = Math.min(1, Math.max(0, video.duration / 2));
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("Impossible de créer l’aperçu vidéo."));
    });
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de créer l’aperçu vidéo.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!blob) throw new Error("Impossible de préparer l’aperçu vidéo.");
    return compressObservationPhoto(new File([blob], "terra-video-poster.jpg", { type: "image/jpeg" }));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
