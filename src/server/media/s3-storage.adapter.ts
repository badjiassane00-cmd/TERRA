import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { MediaStoragePort } from "./storage.port";

/** S3-compatible adapter used for MinIO and other S3-compatible object stores. */
export class S3MediaStorageAdapter implements MediaStoragePort {
  private client: S3Client | null = null;
  private bucketReady: Promise<void> | null = null;
  private config() {
    const endpoint = process.env.MEDIA_S3_ENDPOINT;
    const bucket = process.env.MEDIA_S3_BUCKET;
    const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY;
    const secretAccessKey = process.env.MEDIA_S3_SECRET_KEY;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Le stockage média S3/MinIO n’est pas configuré.");
    return { endpoint, bucket, accessKeyId, secretAccessKey };
  }
  private getClient() {
    if (!this.client) {
      const config = this.config();
      this.client = new S3Client({ endpoint: config.endpoint, region: process.env.MEDIA_S3_REGION || "us-east-1", forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE !== "false", credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
    }
    return this.client;
  }
  private async ensureBucket() {
    if (this.bucketReady) return this.bucketReady;
    const { bucket } = this.config();
    this.bucketReady = (async () => {
      try { await this.getClient().send(new HeadBucketCommand({ Bucket: bucket })); }
      catch {
        try { await this.getClient().send(new CreateBucketCommand({ Bucket: bucket })); }
        catch (error) {
          const name = error instanceof Error ? error.name : "";
          if (name !== "BucketAlreadyExists" && name !== "BucketAlreadyOwnedByYou") throw error;
        }
      }
    })().catch((error) => { this.bucketReady = null; throw error; });
    return this.bucketReady;
  }
  async put(key: string, bytes: Buffer, contentType: string) {
    const { bucket } = this.config();
    await this.ensureBucket();
    await this.getClient().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType, CacheControl: "private, max-age=0, no-store" }));
  }
  async get(key: string) {
    const { bucket } = this.config();
    const result = await this.getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) return null;
    return { body: result.Body.transformToWebStream(), contentType: result.ContentType || "application/octet-stream", contentLength: result.ContentLength };
  }
}
