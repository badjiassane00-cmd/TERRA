import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const communityRepository = {
  listPosts(where: Prisma.CommunityPostWhereInput, viewerId: string | null, take: number) {
    const viewer = viewerId || "__anonymous__";
    return prisma.communityPost.findMany({
      where, orderBy: { createdAt: "desc" }, take,
      include: {
        user: { select: { id: true, name: true, institution: true, avatarUrl: true, isDemo: true, followers: { where: { followerId: viewer }, select: { id: true } } } },
        postLikes: { where: { userId: viewer }, select: { id: true } },
      },
    });
  },
  findForEcology(since: Date, region?: string) {
    return prisma.communityPost.findMany({ where: { removed: false, locationVisibility: "PUBLIC", observedAt: { gte: since }, ...(region ? { region: { contains: region } } : {}) }, select: { plantName: true, scientificName: true, organismGroup: true, region: true, observedAt: true, latitude: true, longitude: true }, orderBy: { observedAt: "desc" }, take: 2500 });
  },
  findForLocalAlerts(since: Date) {
    return prisma.communityPost.findMany({ where: { removed: false, locationVisibility: "PUBLIC", observedAt: { gte: since }, latitude: { not: null }, longitude: { not: null } }, select: { id: true, plantName: true, scientificName: true, organismGroup: true, region: true, observedAt: true, latitude: true, longitude: true }, orderBy: { observedAt: "desc" }, take: 1000 });
  },
  findPendingPosts() { return prisma.communityPost.findMany({ where: { verified: false, removed: false }, orderBy: { createdAt: "desc" }, take: 25 }); },
  findSubmission(clientSubmissionId: string) { return prisma.communityPost.findUnique({ where: { clientSubmissionId } }); },
  createPost(data: Prisma.CommunityPostUncheckedCreateInput) { return prisma.communityPost.create({ data }); },
  findPost(id: string) { return prisma.communityPost.findUnique({ where: { id } }); },
  findVisiblePost(id: string) { return prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true, userId: true, plantName: true } }); },
  updatePost(id: string, data: Prisma.CommunityPostUpdateInput) { return prisma.communityPost.update({ where: { id }, data }); },
  deletePost(id: string) { return prisma.communityPost.delete({ where: { id } }); },
  async toggleLike(postId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.communityPostLike.findUnique({ where: { postId_userId: { postId, userId } } });
      if (existing) {
        await tx.communityPostLike.delete({ where: { id: existing.id } });
        const post = await tx.communityPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } }, select: { likes: true } });
        return { liked: false, likes: post.likes };
      }
      await tx.communityPostLike.create({ data: { postId, userId } });
      const post = await tx.communityPost.update({ where: { id: postId }, data: { likes: { increment: 1 } }, select: { likes: true } });
      return { liked: true, likes: post.likes };
    });
  },
};
