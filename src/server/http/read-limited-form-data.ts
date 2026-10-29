import { ApiError } from "@/server/http/api-handler";

async function readLimitedBytes(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new ApiError("Le fichier dépasse la taille autorisée.", 413);
  if (!request.body) throw new ApiError("Corps de requête manquant.", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiError("Le fichier dépasse la taille autorisée.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function readLimitedText(request: Request, maxBytes: number) {
  const bytes = await readLimitedBytes(request, maxBytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ApiError("Corps de requête invalide.", 400);
  }
}

export async function readLimitedJson<T>(request: Request, maxBytes: number): Promise<T> {
  const text = await readLimitedText(request, maxBytes);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("JSON invalide.", 400);
  }
}

/** Reads multipart bodies incrementally and stops before buffering past the cap. */
export async function readLimitedFormData(request: Request, maxBytes: number): Promise<FormData> {
  const body = await readLimitedBytes(request, maxBytes);
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  const bufferedRequest = new Request(request.url, {
    method: request.method,
    headers,
    body,
  });
  try {
    return await bufferedRequest.formData();
  } catch {
    throw new ApiError("Formulaire multipart invalide.", 400);
  }
}
