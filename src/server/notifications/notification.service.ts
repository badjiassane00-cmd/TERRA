import { notificationRepository } from "./notification.repository";
import { ResendEmailAdapter, TwilioMessageAdapter } from "./provider-adapters";
import type { NotificationStrategy } from "./notification.strategy";
export type { NotificationChannel } from "./notification.strategy";
import type { NotificationChannel } from "./notification.strategy";

const strategies: Record<NotificationChannel, NotificationStrategy> = {
  email: new ResendEmailAdapter(),
  sms: new TwilioMessageAdapter("sms"),
  whatsapp: new TwilioMessageAdapter("whatsapp"),
};

/** Selects a delivery strategy by channel; orchestration never depends on vendor details. */
export function notificationProviders() {
  return Object.fromEntries(Object.entries(strategies).map(([channel, strategy]) => [channel, strategy.isConfigured()])) as Record<NotificationChannel, boolean>;
}

async function deliver(user: { email: string; phoneNumber: string | null }, channel: NotificationChannel, message: { title: string; body: string; href: string }) {
  const strategy = strategies[channel];
  if (!strategy.isConfigured()) throw new Error(`Le fournisseur ${channel} n’est pas configuré sur le serveur.`);
  await strategy.send(user, message);
}

export async function sendTestNotification(userId: string, channel: NotificationChannel) {
  const user = await notificationRepository.findDeliverySettings(userId);
  if (!user) throw new Error("Compte introuvable.");
  const enabled = channel === "email" ? user.notifyEmail : channel === "sms" ? user.notifySms : user.notifyWhatsApp;
  if (!enabled) throw new Error("Activez ce canal et enregistrez vos préférences avant l’envoi du test.");
  const target = channel === "email" ? user.email : user.phoneNumber;
  if (!target) throw new Error("Renseignez d’abord un numéro de téléphone international.");
  await deliver(user, channel, { title: "Votre nature vous écrit", body: "Les notifications TERRA sont bien connectées.", href: "/notifications" });
}

export async function createCommunityNotification(input: { userId: string; actorName: string; title: string; body: string; href: string; kind?: string }) {
  const user = await notificationRepository.findDeliverySettings(input.userId);
  if (!user) return;
  const notification = await notificationRepository.create({ userId: user.id, title: input.title, body: input.body, href: input.href, kind: input.kind || "community" });
  const message = { title: input.title, body: `${input.actorName} ${input.body}`, href: input.href };
  const enabledChannels: Array<[NotificationChannel, boolean]> = [["email", user.notifyEmail], ["sms", user.notifySms], ["whatsapp", user.notifyWhatsApp]];
  await Promise.allSettled(enabledChannels.filter(([, enabled]) => enabled).map(async ([channel]) => {
    try { await deliver(user, channel, message); }
    catch (error) { console.error(`Échec de notification ${channel} pour ${notification.id}:`, error instanceof Error ? error.message : "erreur fournisseur"); }
  }));
}
