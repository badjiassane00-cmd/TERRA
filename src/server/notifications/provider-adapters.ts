import type { NotificationChannel, NotificationMessage, NotificationRecipient, NotificationStrategy } from "./notification.strategy";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export class ResendEmailAdapter implements NotificationStrategy {
  readonly channel = "email" as const;
  isConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL); }
  async send(recipient: NotificationRecipient, message: NotificationMessage) {
    if (!this.isConfigured()) throw new Error("Le service e-mail n’est pas configuré.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [recipient.email], subject: `TERRA · ${message.title}`, html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;padding:26px;border:1px solid #e4ede1;border-radius:16px;color:#263c2e"><h1 style="font-size:21px;color:#5d9d69">${escapeHtml(message.title)}</h1><p style="line-height:1.65">${escapeHtml(message.body)}</p><a href="${escapeHtml(process.env.APP_URL || "http://localhost:3000")}${escapeHtml(message.href)}" style="display:inline-block;margin-top:12px;padding:12px 17px;border-radius:999px;background:#76b980;color:#183c25;text-decoration:none;font-weight:bold">Ouvrir TERRA</a></main>` }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Resend a refusé l’envoi (${response.status}).`);
  }
}

/** Adapter for Twilio's HTTP API, configured independently for SMS or WhatsApp. */
export class TwilioMessageAdapter implements NotificationStrategy {
  constructor(readonly channel: Extract<NotificationChannel, "sms" | "whatsapp">) {}
  isConfigured() {
    const common = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
    return Boolean(this.channel === "sms" ? common && process.env.TWILIO_SMS_FROM : common && process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_CONTENT_SID);
  }
  async send(recipient: NotificationRecipient, message: NotificationMessage) {
    if (!this.isConfigured()) throw new Error(`Le service ${this.channel} n’est pas configuré.`);
    if (!recipient.phoneNumber) throw new Error("Aucun numéro de téléphone enregistré.");
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const fromNumber = this.channel === "sms" ? process.env.TWILIO_SMS_FROM! : process.env.TWILIO_WHATSAPP_FROM!;
    const from = this.channel === "whatsapp" && !fromNumber.startsWith("whatsapp:") ? `whatsapp:${fromNumber}` : fromNumber;
    const to = this.channel === "whatsapp" && !recipient.phoneNumber.startsWith("whatsapp:") ? `whatsapp:${recipient.phoneNumber}` : recipient.phoneNumber;
    const form = new URLSearchParams({ From: from, To: to });
    if (this.channel === "whatsapp") {
      form.set("ContentSid", process.env.TWILIO_WHATSAPP_CONTENT_SID!);
      form.set("ContentVariables", JSON.stringify({ "1": message.title, "2": message.body.slice(0, 180) }));
    } else {
      form.set("Body", `${message.title} — ${message.body} ${process.env.APP_URL || "http://localhost:3000"}${message.href}`.slice(0, 1500));
    }
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Twilio a refusé l’envoi ${this.channel} (${response.status}).`);
  }
}
