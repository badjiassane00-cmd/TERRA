import { ReportStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/moderation";
import { withApiErrors } from "@/server/http/api-handler";

async function PATCHImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(await getSessionUserId());
  if (!admin) return NextResponse.json({ error: "Accès réservé à l’administration." }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as { status?: unknown };
  if (typeof body.status !== "string" || !Object.values(ReportStatus).includes(body.status as ReportStatus)) {
    return NextResponse.json({ error: "Statut de signalement invalide." }, { status: 400 });
  }
  const report = await prisma.communityReport.update({ where: { id }, data: { status: body.status as ReportStatus } });
  return NextResponse.json({ report });
}

export const PATCH = withApiErrors(PATCHImpl);