import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const locationRepository = {
  list(where: Prisma.LocationWhereInput) {
    return prisma.location.findMany({ where, include: { plants: { include: { plant: true } } } });
  },
};
