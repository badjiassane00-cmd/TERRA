import { prisma } from "@/lib/prisma";

export const scanHistoryRepository = {
  listForUser(userId: string, limit: number) {
    return prisma.scanHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  },
  timelineForUser(userId: string) {
    return prisma.scanHistory.findMany({
      where: { userId, plantId: { not: null } },
      orderBy: { createdAt: "asc" },
      include: { plant: { select: { scientificName: true, commonNames: true } } },
    });
  },
  findById(id: string) { return prisma.scanHistory.findUnique({ where: { id } }); },
  update(id: string, data: { courseName?: string | null; objective?: string | null }) {
    return prisma.scanHistory.update({ where: { id }, data });
  },
};
