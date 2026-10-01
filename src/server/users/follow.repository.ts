import { prisma } from "@/lib/prisma";

export const followRepository = {
  toggle(followerId: string, followedId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({ where: { followerId_followedId: { followerId, followedId } } });
      if (existing) {
        await tx.userFollow.delete({ where: { id: existing.id } });
        return { following: false, followers: await tx.userFollow.count({ where: { followedId } }) };
      }
      await tx.userFollow.create({ data: { followerId, followedId } });
      return { following: true, followers: await tx.userFollow.count({ where: { followedId } }) };
    });
  },
};
