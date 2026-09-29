import { prisma } from "@/lib/prisma";

export const observationRepository = {
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
