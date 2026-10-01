import { prisma } from "@/lib/prisma";

export const userRepository = {
  updateAvatar(userId: string, avatarUrl: string | null) {
    return prisma.user.update({ where: { id: userId }, data: { avatarUrl }, select: { id: true, avatarUrl: true } });
  },
  findName(userId: string) { return prisma.user.findUnique({ where: { id: userId }, select: { name: true } }); },
};
