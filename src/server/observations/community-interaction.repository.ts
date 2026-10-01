import { prisma } from "@/lib/prisma";

export const communityInteractionRepository = {
  findCommentTarget(id: string) { return prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true, userId: true, plantName: true } }); },
  async addComment(input: { postId: string; userId: string; body: string }) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.create({ data: input, include: { user: { select: { id: true, name: true } } } });
      await tx.communityPost.update({ where: { id: input.postId }, data: { comments: { increment: 1 } } });
      return comment;
    });
  },
  findIdentificationTarget(id: string) { return prisma.communityPost.findFirst({ where: { id, removed: false }, select: { id: true } }); },
  upsertIdentification(input: { postId: string; userId: string; taxonName: string }) {
    return prisma.communityIdentification.upsert({ where: { postId_userId: { postId: input.postId, userId: input.userId } }, create: input, update: { taxonName: input.taxonName, createdAt: new Date() }, include: { user: { select: { id: true, name: true } } } });
  },
};
