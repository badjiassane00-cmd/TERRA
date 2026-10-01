import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { withApiErrors } from "@/server/http/api-handler";

const VALID_REASONS = ["SPAM", "HARASSMENT", "INAPPROPRIATE", "MISINFORMATION", "OTHER"] as const;

async function POSTImpl(request: Request) {
  const reporterId = await getSessionUserId();
  if (!reporterId) return NextResponse.json({ error: "Connectez-vous pour signaler ce contenu." }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const targetType = body.targetType;
  const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
  const reason = body.reason;
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) : "";
  if ((targetType !== "POST" && targetType !== "USER") || !targetId || targetId.length > 191 || typeof reason !== "string" || !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return NextResponse.json({ error: "Le signalement n’est pas valide." }, { status: 400 });
  }
  if (targetType === "USER" && targetId === reporterId) {
    return NextResponse.json({ error: "Vous ne pouvez pas signaler votre propre compte." }, { status: 400 });
  }

  const targetExists = targetType === "POST"
    ? await prisma.communityPost.findFirst({ where: { id: targetId, removed: false }, select: { id: true } })
    : await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!targetExists) return NextResponse.json({ error: "La cible du signalement est introuvable." }, { status: 404 });

  try {
    const report = await prisma.communityReport.create({
      data: { reporterId, targetType, targetId, reason, details: details || null },
      select: { id: true },
    });
    return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Vous avez déjà signalé cette cible." }, { status: 409 });
    }
    throw error;
  }
}

export const POST = withApiErrors(POSTImpl);