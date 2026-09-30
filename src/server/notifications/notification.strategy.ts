export type NotificationChannel = "email" | "sms" | "whatsapp";

export type NotificationMessage = { title: string; body: string; href: string };
export type NotificationRecipient = { email: string; phoneNumber: string | null };

/** Strategy contract lets the notification workflow stay independent of delivery vendors. */
export interface NotificationStrategy {
  readonly channel: NotificationChannel;
  isConfigured(): boolean;
  send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void>;
}
