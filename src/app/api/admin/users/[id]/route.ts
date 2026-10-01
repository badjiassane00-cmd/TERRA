import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/moderation";
import { withApiErrors } from "@/server/http/api-handler";

async function DELETEImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(await getSessionUserId());
  if (!admin) return NextResponse.json({ error: "Accès réservé à l’administration." }, { status: 403 });
  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  if ((target.role === "ADMIN" || target.role === "SUPER_ADMIN") && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Seul un super-admin peut supprimer un compte administrateur." }, { status: 403 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const DELETE = withApiErrors(DELETEImpl);