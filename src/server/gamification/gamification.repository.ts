import { prisma } from "@/lib/prisma";

export const gamificationRepository = {
  find(userId: string) { return prisma.gamificationProfile.findUnique({ where: { userId } }); },
  create(userId: string) { return prisma.gamificationProfile.create({ data: { userId, points: 0, level: 1, badges: "[]", streak: 1 } }); },
  upsert(userId: string, points: number, dailyLogin: boolean) {
    return prisma.gamificationProfile.upsert({ where: { userId }, update: { points: { increment: points }, streak: dailyLogin ? { increment: 1 } : undefined }, create: { userId, points, level: 1, badges: "[]", streak: 1 } });
  },
  update(userId: string, level: number, badges?: string) { return prisma.gamificationProfile.update({ where: { userId }, data: { level, badges } }); },
};
