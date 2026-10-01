import { prisma } from "@/lib/prisma";

export const observationRepository = {
  findForDiseaseHeatmap(since: Date) {
    return prisma.scanHistory.findMany({ where: { lat: { not: null }, lng: { not: null }, createdAt: { gte: since } }, select: { lat: true, lng: true, result: true, createdAt: true }, take: 5000, orderBy: { createdAt: "desc" } });
  },
  findForDarwinCore(userId: string | null, take: number) {
    return prisma.scanHistory.findMany({ where: userId ? { userId } : undefined, include: { plant: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take });
  },
  findById(id: string, viewerId: string | null = null) {
    return prisma.communityPost.findFirst({
      where: { id, removed: false },
      include: {
        user: { select: { id: true, name: true, institution: true, avatarUrl: true, isDemo: true } },
        postLikes: { where: { userId: viewerId || "__anonymous__" }, select: { id: true } },
        commentsList: {
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { user: { select: { id: true, name: true } } },
        },
        identifications: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  },
};
