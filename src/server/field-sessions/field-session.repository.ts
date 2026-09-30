import { prisma } from "@/lib/prisma";

export const fieldSessionRepository = {
  listForSupervisor(supervisorId: string) {
    return prisma.fieldSession.findMany({ where: { supervisorId }, include: { _count: { select: { entries: true } } }, orderBy: { createdAt: "desc" }, take: 20 });
  },
  findByCode(code: string) {
    return prisma.fieldSession.findUnique({ where: { code }, include: { supervisor: { select: { name: true } } } });
  },
  findById(id: string) {
    return prisma.fieldSession.findUnique({ where: { id }, include: { entries: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } } } });
  },
  findOwner(id: string) { return prisma.fieldSession.findUnique({ where: { id }, select: { id: true, supervisorId: true } }); },
  updateActive(id: string, active: boolean) { return prisma.fieldSession.update({ where: { id }, data: { active } }); },
  create(input: { code: string; title: string; courseName: string | null; supervisorId: string }) {
    return prisma.fieldSession.create({ data: input });
  },
};
