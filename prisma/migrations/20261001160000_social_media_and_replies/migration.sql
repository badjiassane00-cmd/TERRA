ALTER TABLE `community_posts`
  ADD COLUMN `videoUrl` VARCHAR(2048) NULL,
  ADD COLUMN `isEphemeral` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `expiresAt` DATETIME(3) NULL,
  ADD INDEX `community_posts_isEphemeral_expiresAt_createdAt_idx` (`isEphemeral`, `expiresAt`, `createdAt`);

ALTER TABLE `community_comments`
  ADD COLUMN `replyToId` VARCHAR(191) NULL,
  ADD INDEX `community_comments_replyToId_idx` (`replyToId`),
  ADD CONSTRAINT `community_comments_replyToId_fkey`
    FOREIGN KEY (`replyToId`) REFERENCES `community_comments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `catalog_entries`
  ADD COLUMN `videoUrl` VARCHAR(2048) NULL;

ALTER TABLE `exhibition_items`
  ADD COLUMN `videoUrl` VARCHAR(2048) NULL;
