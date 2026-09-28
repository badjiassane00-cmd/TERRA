import { prisma } from "./prisma";

// Vérifie le rôle en base (jamais celui envoyé par le client) avant
// d'autoriser une action de modération/validation institutionnelle.
export async function requireModerator(userId: string | undefined | null) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!user || (user.role !== "INSTITUTION" && user.role !== "ADMIN")) {
    return null;
  }
  return user;
}
