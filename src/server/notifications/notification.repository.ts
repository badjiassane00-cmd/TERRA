import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  findDeliverySettings(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, phoneNumber: true, notifyEmail: true, notifySms: true, notifyWhatsApp: true } });
  },
  create(input: { userId: string; title: string; body: string; href: string; kind: string }) {
    return prisma.notification.create({ data: input });
  },
};
