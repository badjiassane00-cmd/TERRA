import { prisma } from "@/lib/prisma";
import type { OrganismGroup } from "@/types/nature";

export const catalogueRepository = {
  listForUser(userId: string) {
    return prisma.natureCatalog.findMany({ where: { userId }, include: { _count: { select: { entries: true } }, media: { orderBy: { createdAt: "asc" } }, entries: { orderBy: { position: "asc" }, include: { media: { orderBy: { createdAt: "asc" } } } } }, orderBy: { updatedAt: "desc" } });
  },
  create(input: { userId: string; title: string; description: string | null; isPublic: boolean }) {
    return prisma.natureCatalog.create({ data: input });
  },
  findOwned(catalogId: string, userId: string) {
    return prisma.natureCatalog.findFirst({ where: { id: catalogId, userId }, select: { id: true } });
  },
  updateOwned(catalogId: string, userId: string, data: { title?: string; description?: string | null }) {
    return prisma.natureCatalog.updateMany({ where: { id: catalogId, userId }, data });
  },
  deleteOwned(catalogId: string, userId: string) {
    return prisma.natureCatalog.deleteMany({ where: { id: catalogId, userId } });
  },
  findOwnedEntry(catalogId: string, entryId: string, userId: string) {
    return prisma.catalogEntry.findFirst({ where: { id: entryId, catalogId, catalog: { userId } }, select: { id: true } });
  },
  addMedia(input: { catalogId: string; entryId?: string | null; mediaUrl: string; mediaType: string }) {
    return prisma.catalogMedia.create({ data: input });
  },
  async createEntry(input: { catalogId: string; name: string; group: OrganismGroup; scientificName: string | null; imageUrl: string | null; videoUrl: string | null; note: string | null }) {
    const position = await prisma.catalogEntry.count({ where: { catalogId: input.catalogId } });
    return prisma.catalogEntry.create({ data: { ...input, position } });
  },
};
