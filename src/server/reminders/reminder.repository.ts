import { prisma } from "@/lib/prisma";
import type { ReminderType } from "@prisma/client";

export const reminderRepository = {
  listForUser(userId: string) { return prisma.reminder.findMany({ where: { userId }, orderBy: { nextReminder: "asc" } }); },
  create(input: { userId: string; type: ReminderType; plantName: string; frequency: string; time: string; nextReminder: Date; lat: number | null; lng: number | null }) {
    return prisma.reminder.create({ data: { ...input, enabled: true } });
  },
  findOwned(id: string, userId: string) { return prisma.reminder.findFirst({ where: { id, userId }, select: { id: true } }); },
  updateEnabled(id: string, enabled: boolean) { return prisma.reminder.update({ where: { id }, data: { enabled } }); },
  delete(id: string) { return prisma.reminder.delete({ where: { id } }); },
};
