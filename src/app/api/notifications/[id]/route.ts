import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401 });
  const { id } = await params;
  const result = await prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
  if (!result.count) return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
  return NextResponse.json({ success: true });
}
