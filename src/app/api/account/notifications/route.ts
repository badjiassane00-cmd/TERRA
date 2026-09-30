import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { notificationProviders } from "@/server/notifications/notification.service";
async function GETImpl() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const [user, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json({ preferences: user, notifications, unreadCount, providers: notificationProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}



export const GET = withApiErrors(GETImpl);

async function PATCHImpl(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  const body = payload as { markAllRead?: boolean; phoneNumber?: unknown; notifyEmail?: unknown; notifySms?: unknown; notifyWhatsApp?: unknown };
  try {
    if (body.markAllRead === true) {
      await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
      return NextResponse.json({ success: true });
    }
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim().replace(/[ ()-]/g, "") : "";
    const notifySms = body.notifySms === true;
    const notifyWhatsApp = body.notifyWhatsApp === true;
    const notifyEmail = body.notifyEmail === true;
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { smsConsentAt: true, whatsAppConsentAt: true } });
    if (!current) return NextResponse.json({ error: "Compte introuvable." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    if ((notifySms || notifyWhatsApp) && !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Saisissez un numéro international au format +221771234567." }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: phoneNumber || null, notifyEmail, notifySms, notifyWhatsApp,
        smsConsentAt: notifySms ? current.smsConsentAt || new Date() : null,
        whatsAppConsentAt: notifyWhatsApp ? current.whatsAppConsentAt || new Date() : null,
      },
      select: { phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true },
    });
    return NextResponse.json({ preferences: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("Erreur de mise à jour des préférences de notifications.");
    return NextResponse.json({ error: "Impossible d’enregistrer ces préférences." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
