import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const catalogMediaMatch = (url: string): Prisma.NatureCatalogWhereInput => ({
  OR: [
    { media: { some: { mediaUrl: url } } },
    { entries: { some: { OR: [{ imageUrl: url }, { videoUrl: url }, { media: { some: { mediaUrl: url } } }] } } },
  ],
});

const exhibitionMediaMatch = (url: string): Prisma.ExhibitionWhereInput => ({
  OR: [{ coverImage: url }, { items: { some: { OR: [{ imageUrl: url }, { videoUrl: url }] } } }],
});

export const mediaAccessRepository = {
  async getObservationMediaAccess(url: string, viewerId: string | null) {
    const [publicPost, publicCatalog, publicExhibition] = await Promise.all([
      prisma.communityPost.findFirst({ where: { removed: false, isEphemeral: false, publicShareEnabled: true, OR: [{ imageUrl: url }, { thumbnailUrl: url }, { videoUrl: url }] }, select: { id: true } }),
      prisma.natureCatalog.findFirst({ where: { isPublic: true, ...catalogMediaMatch(url) }, select: { id: true } }),
      prisma.exhibition.findFirst({ where: { isPublic: true, ...exhibitionMediaMatch(url) }, select: { id: true } }),
    ]);
    if (publicPost || publicCatalog || publicExhibition) return { public: true, allowed: true };
    if (!viewerId) return { public: false, allowed: false };

    const [foreignPrivateCatalog, foreignPrivateExhibition] = await Promise.all([
      prisma.natureCatalog.findFirst({ where: { isPublic: false, userId: { not: viewerId }, ...catalogMediaMatch(url) }, select: { id: true } }),
      prisma.exhibition.findFirst({ where: { isPublic: false, userId: { not: viewerId }, ...exhibitionMediaMatch(url) }, select: { id: true } }),
    ]);
    return { public: false, allowed: !foreignPrivateCatalog && !foreignPrivateExhibition };
  },
};
