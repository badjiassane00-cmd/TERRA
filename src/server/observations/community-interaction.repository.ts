import { prisma } from "@/lib/prisma";

export const communityInteractionRepository = {
  findCommentTarget(id: string) { return prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true, userId: true, plantName: true } }); },
  findReplyTarget(postId: string, commentId: string) {
    return prisma.communityComment.findFirst({ where: { id: commentId, postId }, select: { id: true, userId: true, user: { select: { name: true } } } });
  },
  async addComment(input: { postId: string; userId: string; body: string; replyToId?: string | null }) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.create({ data: input, include: { user: { select: { id: true, name: true } }, replyTo: { select: { id: true, user: { select: { id: true, name: true } } } } } });
      await tx.communityPost.update({ where: { id: input.postId }, data: { comments: { increment: 1 } } });
      return comment;
    });
  },
  async deleteComment(postId: string, commentId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.communityComment.deleteMany({ where: { id: commentId, postId, userId } });
      if (deleted.count) await tx.communityPost.updateMany({ where: { id: postId, comments: { gt: 0 } }, data: { comments: { decrement: 1 } } });
      return deleted.count;
    });
  },
  findIdentificationTarget(id: string) { return prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true, userId: true } }); },
  upsertIdentification(input: { postId: string; userId: string; taxonName: string }) {
    return prisma.communityIdentification.upsert({ where: { postId_userId: { postId: input.postId, userId: input.userId } }, create: input, update: { taxonName: input.taxonName, createdAt: new Date() }, include: { user: { select: { id: true, name: true } } } });
  },
};
