import { exhibitionRepository } from "./exhibition.repository";

export const exhibitionService = {
  listPublic: () => exhibitionRepository.listPublic(),
  listForUser: (userId: string) => exhibitionRepository.listForUser(userId),
  create(input: { userId: string; title: string; description?: string | null; theme?: string | null; isPublic: boolean }) {
    const title = input.title.trim();
    if (!title) throw new Error("title est requis");
    return exhibitionRepository.create({ ...input, title });
  },
  findById: (id: string) => exhibitionRepository.findById(id),
  async addPlant(exhibitionId: string, userId: string, input: { plantId?: string; scientificName?: string; commonName?: string; imageUrl?: string | null; videoUrl?: string | null; note?: string | null }) {
    const owner = await exhibitionRepository.findOwner(exhibitionId);
    if (!owner) return { kind: "missing" as const };
    if (owner.userId !== userId) return { kind: "forbidden" as const };
    return { kind: "added" as const, item: await exhibitionRepository.addPlant({ exhibitionId, ...input }) };
  },
  async removePlant(exhibitionId: string, itemId: string, userId: string) {
    const owner = await exhibitionRepository.findOwner(exhibitionId);
    if (!owner) return "missing" as const;
    if (owner.userId !== userId) return "forbidden" as const;
    const removed = await exhibitionRepository.deleteItem(exhibitionId, itemId);
    return removed.count ? "removed" as const : "item-missing" as const;
  },
  async updateOwned(id: string, userId: string, data: { title?: string; description?: string | null; theme?: string | null; isPublic?: boolean; coverImage?: string | null }) {
    const owner = await exhibitionRepository.findOwner(id);
    if (!owner) return { kind: "missing" as const };
    if (owner.userId !== userId) return { kind: "forbidden" as const };
    return { kind: "updated" as const, exhibition: await exhibitionRepository.update(id, { ...data, ...(data.title !== undefined ? { title: data.title.trim() } : {}) }) };
  },
  async deleteOwned(id: string, userId: string) {
    const owner = await exhibitionRepository.findOwner(id);
    if (!owner) return "missing" as const;
    if (owner.userId !== userId) return "forbidden" as const;
    await exhibitionRepository.delete(id);
    return "deleted" as const;
  },
};
