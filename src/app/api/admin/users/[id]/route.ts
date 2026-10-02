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

async function PATCHImpl(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(await getSessionUserId());
  if (!admin) return NextResponse.json({ error: "Accès réservé à l’administration." }, { status: 403 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Seul le super-admin peut modifier les rôles." }, { status: 403 });
  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle." }, { status: 400 });
  const body = await request.json() as { role?: unknown };
  if (body.role !== "USER" && body.role !== "ADMIN" && body.role !== "INSTITUTION") {
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: "Le rôle super-admin est réservé au compte configuré côté serveur." }, { status: 403 });
  const user = await prisma.user.update({ where: { id }, data: { role: body.role }, select: { id: true, name: true, role: true, createdAt: true } });
  return NextResponse.json({ user });
}

export const PATCH = withApiErrors(PATCHImpl);
