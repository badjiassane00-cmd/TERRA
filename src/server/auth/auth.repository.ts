import { prisma } from "@/lib/prisma";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  createUser(data: { email: string; password: string; name: string }) {
    return prisma.user.create({ data });
  },
};
