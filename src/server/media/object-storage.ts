import { randomUUID } from "node:crypto";
import { S3MediaStorageAdapter } from "./s3-storage.adapter";

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type ImageMime = keyof typeof MIME_EXTENSIONS;
const storage = new S3MediaStorageAdapter();

function decodeImageDataUrl(dataUrl: string): { bytes: Buffer; mime: ImageMime } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("Le fichier doit être une image JPEG, PNG ou WebP.");
  const mime = match[1] as ImageMime;
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) throw new Error("L’image dépasse la taille maximale de 8 Mo.");
  const valid = mime === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : mime === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new Error("Le contenu du fichier image est invalide.");
  return { bytes, mime };
}

export function isImageDataUrl(value: string) { return value.startsWith("data:image/"); }
export function isStorageConfigured() { return Boolean(process.env.MEDIA_S3_ENDPOINT && process.env.MEDIA_S3_BUCKET && process.env.MEDIA_S3_ACCESS_KEY && process.env.MEDIA_S3_SECRET_KEY); }

async function storeImage(value: string, category: "avatars" | "observations" | "private") {
  const { bytes, mime } = decodeImageDataUrl(value);
  const key = `${category}/${randomUUID()}.${MIME_EXTENSIONS[mime]}`;
  await storage.put(key, bytes, mime);
  return { key, mime };
}

export async function storePublicImage(value: string, category: "avatars" | "observations"): Promise<string> {
  if (/^https:\/\//i.test(value)) return value;
  const { key } = await storeImage(value, category);
  return `/api/media/${key}`;
}

export async function storePrivateImage(value: string) {
  return storeImage(value, "private");
}

export async function readStoredImage(key: string) {
  return storage.get(key);
}
