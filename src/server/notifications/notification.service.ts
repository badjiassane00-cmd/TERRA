import { prisma } from "@/lib/prisma";

export type NotificationChannel = "email" | "sms" | "whatsapp";
type DeliveryMessage = { title: string; body: string; href: string };

function isConfigured(channel: NotificationChannel) {
  if (channel === "email") return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  if (channel === "sms") return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM);
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_CONTENT_SID);
}

export function notificationProviders() {
  return {
    email: isConfigured("email"),
    sms: isConfigured("sms"),
    whatsapp: isConfigured("whatsapp"),
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

async function sendEmail(to: string, message: DeliveryMessage) {
  if (!isConfigured("email")) throw new Error("Le service e-mail n’est pas configuré.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: `TERRA · ${message.title}`,
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;padding:26px;border:1px solid #e4ede1;border-radius:16px;color:#263c2e"><h1 style="font-size:21px;color:#5d9d69">${escapeHtml(message.title)}</h1><p style="line-height:1.65">${escapeHtml(message.body)}</p><a href="${escapeHtml(process.env.APP_URL || "http://localhost:3000")}${escapeHtml(message.href)}" style="display:inline-block;margin-top:12px;padding:12px 17px;border-radius:999px;background:#76b980;color:#183c25;text-decoration:none;font-weight:bold">Ouvrir TERRA</a></main>`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Resend a refusé l’envoi (${response.status}).`);
}

async function sendTwilio(channel: "sms" | "whatsapp", to: string, message: DeliveryMessage) {
  if (!isConfigured(channel)) throw new Error(`Le service ${channel} n’est pas configuré.`);
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const credentials = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const fromNumber = channel === "sms" ? process.env.TWILIO_SMS_FROM! : process.env.TWILIO_WHATSAPP_FROM!;
  const from = channel === "whatsapp" && !fromNumber.startsWith("whatsapp:") ? `whatsapp:${fromNumber}` : fromNumber;
  const recipient = channel === "whatsapp" && !to.startsWith("whatsapp:") ? `whatsapp:${to}` : to;
  const form = new URLSearchParams({ From: from, To: recipient });
  if (channel === "whatsapp") {
    form.set("ContentSid", process.env.TWILIO_WHATSAPP_CONTENT_SID!);
    form.set("ContentVariables", JSON.stringify({ "1": message.title, "2": message.body.slice(0, 180) }));
  } else {
    form.set("Body", `${message.title} — ${message.body} ${process.env.APP_URL || "http://localhost:3000"}${message.href}`.slice(0, 1500));
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Twilio a refusé l’envoi ${channel} (${response.status}).`);
}

async function sendChannel(user: { email: string; phoneNumber: string | null }, channel: NotificationChannel, message: DeliveryMessage) {
  if (channel === "email") return sendEmail(user.email, message);
  if (!user.phoneNumber) throw new Error("Aucun numéro de téléphone enregistré.");
  return sendTwilio(channel, user.phoneNumber, message);
}

export async function sendTestNotification(userId: string, channel: NotificationChannel) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } });
  if (!user) throw new Error("Compte introuvable.");
  const enabled = channel === "email" ? user.notifyEmail : channel === "sms" ? user.notifySms : user.notifyWhatsApp;
  if (!enabled) throw new Error("Activez ce canal et enregistrez vos préférences avant l’envoi du test.");
  if (!isConfigured(channel)) throw new Error(`Le fournisseur ${channel} n’est pas configuré sur le serveur.`);
  const target = channel === "email" ? user.email : user.phoneNumber;
  if (!target) throw new Error("Renseignez d’abord un numéro de téléphone international.");
  await sendChannel(user, channel, { title: "Votre nature vous écrit", body: "Les notifications TERRA sont bien connectées." , href: "/notifications" });
}

export async function createCommunityNotification(input: {
  userId: string;
  actorName: string;
  title: string;
  body: string;
  href: string;
  kind?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true },
  });
  if (!user) return;
  const notification = await prisma.notification.create({ data: { userId: user.id, title: input.title, body: input.body, href: input.href, kind: input.kind || "community" } });
  const message = { title: input.title, body: `${input.actorName} ${input.body}`, href: input.href };
  const deliveries: Array<[NotificationChannel, boolean]> = [["email", user.notifyEmail], ["sms", user.notifySms], ["whatsapp", user.notifyWhatsApp]];
  await Promise.allSettled(deliveries.filter(([, enabled]) => enabled).map(async ([channel]) => {
    try { await sendChannel(user, channel, message); }
    catch (error) { console.error(`Échec de notification ${channel} pour ${notification.id}:`, error instanceof Error ? error.message : "erreur fournisseur"); }
  }));
}
