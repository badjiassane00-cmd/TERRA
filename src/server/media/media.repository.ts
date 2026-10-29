import { prisma } from "@/lib/prisma";

export const mediaRepository = {
  createOwnedAsset(userId: string, objectKey: string, contentType: string) {
    return prisma.mediaAsset.create({ data: { userId, objectKey, contentType }, select: { id: true } });
  },
  findOwnedAsset(id: string, userId: string) {
    return prisma.mediaAsset.findFirst({ where: { id, userId }, select: { objectKey: true, contentType: true } });
  },
  async ownsPrivateUrl(url: string, userId: string) {
    const match = /^\/api\/media\/private\/([a-z0-9]+)$/i.exec(url);
    if (!match) return true;
    return Boolean(await prisma.mediaAsset.findFirst({ where: { id: match[1], userId }, select: { id: true } }));
  },
};
