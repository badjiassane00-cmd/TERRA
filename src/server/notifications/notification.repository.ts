import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  findDeliverySettings(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } });
  },
  async listForUser(userId: string) {
    const [user, notifications, unreadCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { user, notifications, unreadCount };
  },
  findConsentTimestamps(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { smsConsentAt: true, whatsAppConsentAt: true } });
  },
  updatePreferences(userId: string, data: { phoneNumber: string | null; notifyEmail: boolean; notifySms: boolean; notifyWhatsApp: boolean; smsConsentAt: Date | null; whatsAppConsentAt: Date | null }) {
    return prisma.user.update({ where: { id: userId }, data, select: { phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } });
  },
  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  },
  markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  },
  create(input: { userId: string; title: string; body: string; href: string; kind: string }) {
    return prisma.notification.create({ data: input });
  },
};
