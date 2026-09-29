import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { sendTestNotification, type NotificationChannel } from "@/server/notifications/notification.service";

const channels = new Set<NotificationChannel>(["email", "sms", "whatsapp"]);

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour tester vos notifications." }, { status: 401 });
  try {
    const body = await request.json() as { channel?: string };
    if (!body.channel || !channels.has(body.channel as NotificationChannel)) return NextResponse.json({ error: "Canal de notification invalide." }, { status: 400 });
    await sendTestNotification(userId, body.channel as NotificationChannel);
    return NextResponse.json({ message: "Notification de test envoyée." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Échec de l’envoi." }, { status: 503 });
  }
}
