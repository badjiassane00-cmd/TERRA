export type StoredObject = { body: ReadableStream<Uint8Array>; contentType: string; contentLength?: number };

/** Storage port keeps media use cases independent from S3/MinIO. */
export interface MediaStoragePort {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}
