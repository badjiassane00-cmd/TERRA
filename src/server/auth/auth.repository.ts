import { prisma } from "@/lib/prisma";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findUserByIdentifier(identifier: string, phone: string | null) {
    return prisma.user.findFirst({
      where: { OR: [{ email: identifier }, ...(phone ? [{ authPhone: phone }] : [])] },
    });
  },

  createUser(data: { email: string; password: string; name: string; authPhone?: string | null; phoneNumber?: string | null; role?: "USER" | "SUPER_ADMIN" }) {
    return prisma.user.create({ data });
  },

  updateRole(id: string, role: "USER" | "ADMIN" | "INSTITUTION" | "SUPER_ADMIN") {
    return prisma.user.update({ where: { id }, data: { role } });
  },
};
