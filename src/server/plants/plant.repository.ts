import { prisma } from "@/lib/prisma";

export const plantRepository = {
  listForRecognition() {
    return prisma.plant.findMany({ select: { id: true, scientificName: true, commonNames: true, family: true, description: true, medicinal: true, watering: true, sunlight: true, soil: true } });
  },
  findCalendar(scientificName: string) {
    return prisma.plant.findUnique({ where: { scientificName }, select: { sowingMonths: true, bloomingMonths: true, harvestMonths: true, watering: true, sunlight: true } });
  },
  listForExhibition() {
    return prisma.plant.findMany({ include: { diseases: { include: { disease: true } } } });
  },
  listWithFamilies() {
    return prisma.plant.findMany({ where: { family: { not: null } }, select: { id: true, scientificName: true, commonNames: true, family: true, imageUrl: true } });
  },
  findForEnrichment(name: string) {
    return prisma.plant.findFirst({ where: { OR: [{ scientificName: { contains: name } }, { commonNames: { contains: name } }] }, select: { id: true, description: true, medicinal: true, watering: true, sunlight: true, soil: true, toxicity: true, edibleParts: true } });
  },
  listSpecialty(specialty?: string) {
    return prisma.plant.findMany({
      where: { taxonomy: { contains: specialty ? `"specialty":"${specialty}"` : '"specialty"' } },
      include: { locations: { include: { location: true } } },
      take: 100,
    });
  },
};
