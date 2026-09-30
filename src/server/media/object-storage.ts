import { randomUUID } from "node:crypto";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type ImageMime = keyof typeof MIME_EXTENSIONS;
let client: S3Client | null = null;
let bucketReady: Promise<void> | null = null;

function getConfig() {
  const endpoint = process.env.MEDIA_S3_ENDPOINT;
  const bucket = process.env.MEDIA_S3_BUCKET;
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY;
  const secretAccessKey = process.env.MEDIA_S3_SECRET_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Le stockage média S3/MinIO n’est pas configuré.");
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

function getClient() {
  if (client) return client;
  const config = getConfig();
  client = new S3Client({ endpoint: config.endpoint, region: process.env.MEDIA_S3_REGION || "us-east-1", forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE !== "false", credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  return client;
}

async function ensureBucket() {
  if (bucketReady) return bucketReady;
  const { bucket } = getConfig();
  bucketReady = (async () => {
    try { await getClient().send(new HeadBucketCommand({ Bucket: bucket })); }
    catch {
      try { await getClient().send(new CreateBucketCommand({ Bucket: bucket })); }
      catch (error) {
        const name = error instanceof Error ? error.name : "";
        if (name !== "BucketAlreadyExists" && name !== "BucketAlreadyOwnedByYou") throw error;
      }
    }
  })().catch((error) => { bucketReady = null; throw error; });
  return bucketReady;
}

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
  const { bucket } = getConfig();
  await ensureBucket();
  const key = `${category}/${randomUUID()}.${MIME_EXTENSIONS[mime]}`;
  await getClient().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: mime, CacheControl: "private, max-age=0, no-store" }));
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
  const { bucket } = getConfig();
  const result = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) return null;
  return { body: result.Body.transformToWebStream(), contentType: result.ContentType || "application/octet-stream", contentLength: result.ContentLength };
}
