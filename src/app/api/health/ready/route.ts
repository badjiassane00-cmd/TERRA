import { NextResponse } from "next/server";
import { withApiErrors } from "@/server/http/api-handler";
import { prisma } from "@/lib/prisma";
import { checkStorageReady } from "@/server/media/object-storage";

export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

async function GETImpl() {
  const [database, media] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`, 5000).then(() => true).catch(() => false),
    withTimeout(checkStorageReady(), 5000).catch(() => false),
  ]);
  const ready = database && media;
  return NextResponse.json(
    { status: ready ? "ok" : "degraded", dependencies: { database, media } },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = withApiErrors(GETImpl);
