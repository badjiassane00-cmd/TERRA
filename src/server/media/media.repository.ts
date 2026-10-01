import { prisma } from "@/lib/prisma";

export const mediaRepository = {
  findOwnedAsset(id: string, userId: string) {
    return prisma.mediaAsset.findFirst({ where: { id, userId }, select: { objectKey: true, contentType: true } });
  },
};
