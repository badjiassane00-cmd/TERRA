import { NextResponse } from "next/server";
import { readinessStatus } from "@/server/health/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await readinessStatus();
  return NextResponse.json(status, {
    status: status.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
