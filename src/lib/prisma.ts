import { PrismaClient } from "@prisma/client";

// Singleton Prisma — évite de créer une nouvelle connexion à chaque
// import (anti-pattern courant avec Next.js en dev/hot-reload et en
// serverless). Voir https://www.prisma.io/docs/guides/nextjs
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
