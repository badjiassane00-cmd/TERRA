import { fieldSessionRepository } from "./field-session.repository";
import { randomInt } from "node:crypto";

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export const fieldSessionService = {
  listForSupervisor: (id: string) => fieldSessionRepository.listForSupervisor(id),
  findById: (id: string) => fieldSessionRepository.findById(id),
  findSummaryById: (id: string) => fieldSessionRepository.findSummaryById(id),
  async join(code: string) {
    if (!code.trim()) return null;
    const session = await fieldSessionRepository.findByCode(code.trim().toUpperCase());
    return session?.active ? session : null;
  },
  async create(input: { title: string; courseName?: string | null; supervisorId: string }) {
    const title = input.title.trim();
    if (!title) throw new Error("title est requis");
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!(await fieldSessionRepository.findByCode(code))) break;
      code = generateCode();
    }
    return fieldSessionRepository.create({ code, title, courseName: input.courseName || null, supervisorId: input.supervisorId });
  },
  async setActive(id: string, userId: string, active: boolean) {
    const session = await fieldSessionRepository.findOwner(id);
    if (!session) return { kind: "missing" as const };
    if (session.supervisorId !== userId) return { kind: "forbidden" as const };
    return { kind: "updated" as const, session: await fieldSessionRepository.updateActive(id, active) };
  },
};
