import { prisma } from "@/lib/prisma";

export const ecologyRepository = {
  findSpeciesSummary() {
    return prisma.communityPost.findMany({ where: { removed: false, locationVisibility: "PUBLIC" }, select: { organismGroup: true, scientificName: true }, take: 10000 });
  },
};
