import { prisma } from "@/lib/prisma";

const summaryInclude = { _count: { select: { items: true } }, user: { select: { name: true } } } as const;

export const exhibitionRepository = {
  listPublic() {
    return prisma.exhibition.findMany({ where: { isPublic: true }, include: summaryInclude, orderBy: { updatedAt: "desc" }, take: 30 });
  },
  listForUser(userId: string) {
    return prisma.exhibition.findMany({ where: { userId }, include: summaryInclude, orderBy: { updatedAt: "desc" } });
  },
  create(input: { userId: string; title: string; description?: string | null; theme?: string | null; isPublic: boolean }) {
    return prisma.exhibition.create({ data: input });
  },
  findById(id: string) {
    return prisma.exhibition.findUnique({ where: { id }, include: { user: { select: { name: true } }, items: { orderBy: { position: "asc" }, include: { plant: { select: { id: true, scientificName: true, commonNames: true, family: true, imageUrl: true, medicinal: true } } } } } });
  },
  findOwner(id: string) { return prisma.exhibition.findUnique({ where: { id }, select: { id: true, userId: true } }); },
  update(id: string, data: { title?: string; description?: string | null; theme?: string | null; isPublic?: boolean; coverImage?: string | null }) {
    return prisma.exhibition.update({ where: { id }, data });
  },
  delete(id: string) { return prisma.exhibition.delete({ where: { id } }); },
};
