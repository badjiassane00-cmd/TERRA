import { withApiErrors } from "@/server/http/api-handler";
import { NextResponse } from "next/server";
import { notificationRepository } from "@/server/notifications/notification.repository";
import { getSessionUserId } from "@/lib/session";
import { notificationProviders } from "@/server/notifications/notification.service";
async function GETImpl() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour gérer vos notifications." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const { user, notifications, unreadCount } = await notificationRepository.listForUser(userId);
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
      await notificationRepository.markAllRead(userId);
      return NextResponse.json({ success: true });
    }
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim().replace(/[ ()-]/g, "") : "";
    const notifySms = body.notifySms === true;
    const notifyWhatsApp = body.notifyWhatsApp === true;
    const notifyEmail = body.notifyEmail === true;
    const current = await notificationRepository.findConsentTimestamps(userId);
    if (!current) return NextResponse.json({ error: "Compte introuvable." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    if ((notifySms || notifyWhatsApp) && !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Saisissez un numéro international au format +221771234567." }, { status: 400 });
    }
    const updated = await notificationRepository.updatePreferences(userId, {
      phoneNumber: phoneNumber || null, notifyEmail, notifySms, notifyWhatsApp,
      smsConsentAt: notifySms ? current.smsConsentAt || new Date() : null,
      whatsAppConsentAt: notifyWhatsApp ? current.whatsAppConsentAt || new Date() : null,
    });
    return NextResponse.json({ preferences: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("Erreur de mise à jour des préférences de notifications.");
    return NextResponse.json({ error: "Impossible d’enregistrer ces préférences." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}


export const PATCH = withApiErrors(PATCHImpl);
