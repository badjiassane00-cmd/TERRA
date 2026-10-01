import { NextResponse } from "next/server";
import { withApiErrors } from "@/server/http/api-handler";
import { prisma } from "@/lib/prisma";
import { checkStorageReady } from "@/server/media/object-storage";

async function GETImpl() {
  const [database, media] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    checkStorageReady(),
  ]);
  const ready = database && media;
  return NextResponse.json({ status: ready ? "ok" : "degraded", dependencies: { database, media } }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = withApiErrors(GETImpl);
