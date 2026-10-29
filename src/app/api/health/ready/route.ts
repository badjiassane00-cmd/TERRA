import { NextResponse } from "next/server";
import { withApiErrors } from "@/server/http/api-handler";
import { readinessStatus } from "@/server/health/readiness";

export const dynamic = "force-dynamic";

async function GETImpl() {
  const status = await readinessStatus();
  return NextResponse.json(
    status,
    { status: status.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = withApiErrors(GETImpl);
