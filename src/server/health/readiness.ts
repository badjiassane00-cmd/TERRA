import { prisma } from "@/lib/prisma";
import { checkStorageReady } from "@/server/media/object-storage";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function readinessStatus() {
  const [database, media] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`, 5000).then(() => true).catch(() => false),
    withTimeout(checkStorageReady(), 5000).catch(() => false),
  ]);
  return { status: database && media ? "ok" : "degraded", dependencies: { database, media } };
}
