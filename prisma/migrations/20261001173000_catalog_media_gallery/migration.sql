CREATE TABLE `catalog_media` (
  `id` VARCHAR(191) NOT NULL,
  `catalogId` VARCHAR(191) NOT NULL,
  `entryId` VARCHAR(191) NULL,
  `mediaUrl` VARCHAR(2048) NOT NULL,
  `mediaType` VARCHAR(12) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `catalog_media_catalogId_createdAt_idx` (`catalogId`, `createdAt`),
  INDEX `catalog_media_entryId_createdAt_idx` (`entryId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `catalog_media_catalogId_fkey` FOREIGN KEY (`catalogId`) REFERENCES `nature_catalogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `catalog_media_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `catalog_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
