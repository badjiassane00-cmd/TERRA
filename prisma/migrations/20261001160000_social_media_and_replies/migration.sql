-- community_posts : colonnes d'abord, index ensuite (TiDB)
ALTER TABLE `community_posts` ADD COLUMN `videoUrl` VARCHAR(2048) NULL;
ALTER TABLE `community_posts` ADD COLUMN `isEphemeral` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `community_posts` ADD COLUMN `expiresAt` DATETIME(3) NULL;
ALTER TABLE `community_posts` ADD INDEX `community_posts_isEphemeral_expiresAt_createdAt_idx` (`isEphemeral`, `expiresAt`, `createdAt`);

-- community_comments : colonne, puis index, puis clé étrangère
ALTER TABLE `community_comments` ADD COLUMN `replyToId` VARCHAR(191) NULL;
ALTER TABLE `community_comments` ADD INDEX `community_comments_replyToId_idx` (`replyToId`);
ALTER TABLE `community_comments`
  ADD CONSTRAINT `community_comments_replyToId_fkey`
  FOREIGN KEY (`replyToId`) REFERENCES `community_comments` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `catalog_entries` ADD COLUMN `videoUrl` VARCHAR(2048) NULL;

ALTER TABLE `exhibition_items` ADD COLUMN `videoUrl` VARCHAR(2048) NULL;
