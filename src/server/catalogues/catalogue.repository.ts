import { prisma } from "@/lib/prisma";
import type { OrganismGroup } from "@/types/nature";

export const catalogueRepository = {
  listForUser(userId: string) {
    return prisma.natureCatalog.findMany({ where: { userId }, include: { _count: { select: { entries: true } }, entries: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } });
  },
  create(input: { userId: string; title: string; description: string | null; isPublic: boolean }) {
    return prisma.natureCatalog.create({ data: input });
  },
  findOwned(catalogId: string, userId: string) {
    return prisma.natureCatalog.findFirst({ where: { id: catalogId, userId }, select: { id: true } });
  },
  async createEntry(input: { catalogId: string; name: string; group: OrganismGroup; scientificName: string | null; imageUrl: string | null; note: string | null }) {
    const position = await prisma.catalogEntry.count({ where: { catalogId: input.catalogId } });
    return prisma.catalogEntry.create({ data: { ...input, position } });
  },
};
