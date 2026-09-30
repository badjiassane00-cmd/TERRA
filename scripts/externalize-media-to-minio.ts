import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { isImageDataUrl, isStorageConfigured, storePrivateImage, storePublicImage } from "../src/server/media/object-storage";

async function main() {
  loadEnvConfig(process.cwd());
if (!isStorageConfigured()) throw new Error("Configurez MEDIA_S3_* avant de transférer les images intégrées vers le stockage objet.");
const prisma = new PrismaClient();
let migrated = 0;
try {
  const users = await prisma.user.findMany({ where: { avatarUrl: { startsWith: "data:image/" } }, select: { id: true, avatarUrl: true } });
  for (const user of users) if (user.avatarUrl && isImageDataUrl(user.avatarUrl)) {
    const avatarUrl = await storePublicImage(user.avatarUrl, "avatars");
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } }); migrated++;
  }
  const posts = await prisma.communityPost.findMany({ where: { OR: [{ imageUrl: { startsWith: "data:image/" } }, { thumbnailUrl: { startsWith: "data:image/" } }] } });
  for (const post of posts) {
    const imageUrl = isImageDataUrl(post.imageUrl) ? await storePublicImage(post.imageUrl, "observations") : post.imageUrl;
    const thumbnailUrl = post.thumbnailUrl && isImageDataUrl(post.thumbnailUrl) ? await storePublicImage(post.thumbnailUrl, "observations") : post.thumbnailUrl;
    await prisma.communityPost.update({ where: { id: post.id }, data: { imageUrl, thumbnailUrl } }); migrated++;
  }
  const scans = await prisma.scanHistory.findMany({ where: { imageUrl: { startsWith: "data:image/" } }, select: { id: true, userId: true, imageUrl: true } });
  for (const scan of scans) if (scan.imageUrl && isImageDataUrl(scan.imageUrl)) {
    const asset = await storePrivateImage(scan.imageUrl);
    const record = await prisma.mediaAsset.create({ data: { userId: scan.userId, objectKey: asset.key, contentType: asset.mime } });
    await prisma.scanHistory.update({ where: { id: scan.id }, data: { imageUrl: `/api/media/private/${record.id}` } }); migrated++;
  }
  console.log(`Images externalisées vers MinIO : ${migrated}.`);
} finally { await prisma.$disconnect(); }

}

void main().catch((error: unknown) => { console.error("Externalisation interrompue :", error instanceof Error ? error.message : "erreur inconnue"); process.exitCode = 1; });
