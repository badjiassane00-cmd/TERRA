import { prisma } from "@/lib/prisma";

export const localNameRepository = {
  findPending() { return prisma.localName.findMany({ where: { verified: false }, include: { plant: { select: { scientificName: true } } }, orderBy: { createdAt: "desc" }, take: 25 }); },
  listForPlant(scientificName: string) {
    return prisma.plant.findUnique({ where: { scientificName }, select: { localNames: { orderBy: [{ votes: "desc" }, { createdAt: "asc" }] } } });
  },
  async add(input: { scientificName: string; language: string; languageName: string; name: string; contributedBy: string | null }) {
    const plant = await prisma.plant.upsert({ where: { scientificName: input.scientificName }, update: {}, create: { scientificName: input.scientificName } });
    return prisma.localName.upsert({
      where: { plantId_language_name: { plantId: plant.id, language: input.language, name: input.name } },
      update: { votes: { increment: 1 } },
      create: { plantId: plant.id, language: input.language, languageName: input.languageName, name: input.name, contributedBy: input.contributedBy },
    });
  },
  verify(id: string, verifiedBy?: string) {
    return prisma.localName.update({ where: { id }, data: { verified: true, ...(verifiedBy ? { verifiedBy } : {}) } });
  },
  delete(id: string) { return prisma.localName.delete({ where: { id } }); },
};
