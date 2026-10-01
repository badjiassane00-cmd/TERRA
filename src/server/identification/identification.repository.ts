import { prisma } from "@/lib/prisma";
import type { Identification } from "@/lib/botany";

export const identificationRepository = {
  async saveScan(userId: string, result: Identification, latitude: number | null, longitude: number | null, sessionId: string | null) {
    const taxonomy = JSON.stringify(result.taxonomy);
    const plant = await prisma.plant.upsert({
      where: { scientificName: result.scientific_name },
      update: { commonNames: JSON.stringify(result.common_names), kingdom: result.taxonomy?.kingdom, phylum: result.taxonomy?.phylum, taxClass: result.taxonomy?.class, order: result.taxonomy?.order, family: result.taxonomy?.family, genus: result.taxonomy?.genus, species: result.taxonomy?.species, taxonomy, gbifId: result.sources.gbif?.split("/").pop() },
      create: { scientificName: result.scientific_name, commonNames: JSON.stringify(result.common_names), kingdom: result.taxonomy?.kingdom, phylum: result.taxonomy?.phylum, taxClass: result.taxonomy?.class, order: result.taxonomy?.order, family: result.taxonomy?.family, genus: result.taxonomy?.genus, species: result.taxonomy?.species, taxonomy, gbifId: result.sources.gbif?.split("/").pop() },
    });
    return prisma.scanHistory.create({ data: { userId, plantId: plant.id, result: result as object, lat: latitude, lng: longitude, sessionId } });
  },
  saveResult(userId: string, result: object) { return prisma.scanHistory.create({ data: { userId, result } }); },
  async saveCandidates(userId: string, scientificName: string, name: string, description: string, result: string) {
    let plant = await prisma.plant.findFirst({ where: { scientificName: { contains: scientificName } } });
    if (!plant) plant = await prisma.plant.create({ data: { scientificName, commonNames: JSON.stringify([name]), description, taxonomy: JSON.stringify({ genus: scientificName.split(" ")[0] }) } });
    return prisma.scanHistory.create({ data: { userId, plantId: plant.id, result } });
  },
};
