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
  addPlant(input: { exhibitionId: string; plantId?: string; scientificName?: string; commonName?: string; imageUrl?: string | null; videoUrl?: string | null; note?: string | null }) {
    return prisma.$transaction(async (tx) => {
      let plantId = input.plantId;
      if (!plantId && input.scientificName) {
        const plant = await tx.plant.upsert({ where: { scientificName: input.scientificName }, update: {}, create: { scientificName: input.scientificName, commonNames: input.commonName ? JSON.stringify([input.commonName]) : "[]", imageUrl: input.imageUrl || null } });
        plantId = plant.id;
      }
      if (!plantId) throw new Error("plantId ou scientificName requis");
      const position = await tx.exhibitionItem.count({ where: { exhibitionId: input.exhibitionId } });
      return tx.exhibitionItem.upsert({
        where: { exhibitionId_plantId: { exhibitionId: input.exhibitionId, plantId } },
        update: { note: input.note ?? undefined, imageUrl: input.imageUrl ?? undefined, videoUrl: input.videoUrl ?? undefined },
        create: { exhibitionId: input.exhibitionId, plantId, note: input.note || null, imageUrl: input.imageUrl || null, videoUrl: input.videoUrl || null, position },
        include: { plant: true },
      });
    });
  },
  deleteItem(exhibitionId: string, itemId: string) {
    return prisma.exhibitionItem.deleteMany({ where: { id: itemId, exhibitionId } });
  },
};
