import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { notificationProviders } from "@/server/notifications/notification.service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401 });
  const [user, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true, smsConsentAt: true, whatsAppConsentAt: true } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  return NextResponse.json({ preferences: user, notifications, unreadCount, providers: notificationProviders() });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401 });
  try {
    const body = await request.json() as { markAllRead?: boolean; phoneNumber?: unknown; notifyEmail?: unknown; notifySms?: unknown; notifyWhatsApp?: unknown };
    if (body.markAllRead) {
      await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
      return NextResponse.json({ success: true });
    }
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim().replace(/[ ()-]/g, "") : "";
    const notifySms = body.notifySms === true;
    const notifyWhatsApp = body.notifyWhatsApp === true;
    const notifyEmail = body.notifyEmail === true;
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { smsConsentAt: true, whatsAppConsentAt: true } });
    if (!current) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
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
      select: { email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true, smsConsentAt: true, whatsAppConsentAt: true },
    });
    return NextResponse.json({ preferences: updated });
  } catch {
    return NextResponse.json({ error: "Impossible d’enregistrer ces préférences." }, { status: 400 });
  }
}
