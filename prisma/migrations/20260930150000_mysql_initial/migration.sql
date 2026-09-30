-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `avatarUrl` VARCHAR(2048) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `notifyEmail` BOOLEAN NOT NULL DEFAULT false,
    `notifySms` BOOLEAN NOT NULL DEFAULT false,
    `notifyWhatsApp` BOOLEAN NOT NULL DEFAULT false,
    `smsConsentAt` DATETIME(3) NULL,
    `whatsAppConsentAt` DATETIME(3) NULL,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('USER', 'INSTITUTION', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plants` (
    `id` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NOT NULL,
    `commonNames` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `kingdom` VARCHAR(191) NULL,
    `phylum` VARCHAR(191) NULL,
    `taxClass` VARCHAR(191) NULL,
    `order` VARCHAR(191) NULL,
    `family` VARCHAR(191) NULL,
    `genus` VARCHAR(191) NULL,
    `species` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `taxonomy` TEXT NULL,
    `medicinal` BOOLEAN NULL,
    `edibleParts` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `toxicity` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `watering` VARCHAR(191) NULL,
    `sunlight` VARCHAR(191) NULL,
    `soil` VARCHAR(191) NULL,
    `growthRate` VARCHAR(191) NULL,
    `sowingMonths` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `bloomingMonths` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `harvestMonths` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `imageUrl` VARCHAR(2048) NULL,
    `gbifId` VARCHAR(191) NULL,
    `iNaturalistId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plants_scientificName_key`(`scientificName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diseases` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `treatment` VARCHAR(4000) NOT NULL DEFAULT '[]',
    `confidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `diseases_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_diseases` (
    `id` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `diseaseId` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `plant_diseases_plantId_diseaseId_key`(`plantId`, `diseaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `speciesCount` INTEGER NOT NULL DEFAULT 0,
    `type` ENUM('JARDIN_BOTANIQUE', 'PARC_NATIONAL', 'RESERVE', 'JARDIN_UNIVERSITAIRE', 'COMMERCE') NOT NULL,
    `description` TEXT NULL,
    `bloomingMonths` VARCHAR(4000) NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `location_plants` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `location_plants_locationId_plantId_key`(`locationId`, `plantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scan_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NULL,
    `imageUrl` LONGTEXT NULL,
    `result` JSON NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `courseName` VARCHAR(500) NULL,
    `objective` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `field_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `courseName` VARCHAR(500) NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `field_sessions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NULL,
    `locationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `favorites_userId_plantId_key`(`userId`, `plantId`),
    UNIQUE INDEX `favorites_userId_locationId_key`(`userId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_posts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plantName` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(2048) NOT NULL,
    `thumbnailUrl` VARCHAR(2048) NULL,
    `region` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `organismGroup` ENUM('PLANT', 'INSECT', 'BIRD', 'MAMMAL', 'REPTILE', 'AMPHIBIAN', 'FUNGUS', 'AQUATIC', 'OTHER') NOT NULL DEFAULT 'PLANT',
    `observedAt` DATETIME(3) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `locationVisibility` ENUM('PUBLIC', 'APPROXIMATE', 'PRIVATE') NOT NULL DEFAULT 'APPROXIMATE',
    `sourceUrl` VARCHAR(191) NULL,
    `clientSubmissionId` VARCHAR(191) NULL,
    `sourceObserver` VARCHAR(191) NULL,
    `photoAttribution` VARCHAR(191) NULL,
    `photoLicense` VARCHAR(191) NULL,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `comments` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `removed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `community_posts_sourceUrl_key`(`sourceUrl`),
    UNIQUE INDEX `community_posts_clientSubmissionId_key`(`clientSubmissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gamification_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `badges` VARCHAR(4000) NOT NULL DEFAULT '[]',
    `streak` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gamification_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('WATERING', 'SUNLIGHT', 'FERTILIZING', 'PRUNING') NOT NULL,
    `plantName` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `nextReminder` DATETIME(3) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_data` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `plantName` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NOT NULL,
    `imageUrl` LONGTEXT NOT NULL,
    `label` VARCHAR(500) NOT NULL,
    `confidence` DOUBLE NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `usedForTraining` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_versions` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `accuracy` DOUBLE NULL,
    `loss` DOUBLE NULL,
    `trainingDataCount` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'TRAINING', 'READY', 'DEPLOYED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `modelUrl` VARCHAR(2048) NULL,
    `deployed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `model_versions_version_key`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `local_names` (
    `id` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `languageName` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contributedBy` VARCHAR(191) NULL,
    `votes` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `local_names_plantId_language_name_key`(`plantId`, `language`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_contributions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('TRAINING_IMAGE', 'LABEL_CORRECTION', 'PLANT_SIGHTING', 'DISEASE_REPORT') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exhibitions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `coverImage` VARCHAR(2048) NULL,
    `theme` VARCHAR(191) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nature_catalogs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `nature_catalogs_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `objectKey` VARCHAR(512) NOT NULL,
    `contentType` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `media_assets_objectKey_key`(`objectKey`),
    INDEX `media_assets_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalog_entries` (
    `id` VARCHAR(191) NOT NULL,
    `catalogId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NULL,
    `group` ENUM('PLANT', 'INSECT', 'BIRD', 'MAMMAL', 'REPTILE', 'AMPHIBIAN', 'FUNGUS', 'AQUATIC', 'OTHER') NOT NULL DEFAULT 'PLANT',
    `imageUrl` VARCHAR(2048) NULL,
    `note` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `catalog_entries_catalogId_position_idx`(`catalogId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exhibition_items` (
    `id` VARCHAR(191) NOT NULL,
    `exhibitionId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exhibition_items_exhibitionId_plantId_key`(`exhibitionId`, `plantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_comments` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `community_comments_postId_createdAt_idx`(`postId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_identifications` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taxonName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `community_identifications_postId_createdAt_idx`(`postId`, `createdAt`),
    UNIQUE INDEX `community_identifications_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_post_likes` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `community_post_likes_userId_createdAt_idx`(`userId`, `createdAt`),
    UNIQUE INDEX `community_post_likes_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_follows` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `followedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_follows_followedId_createdAt_idx`(`followedId`, `createdAt`),
    UNIQUE INDEX `user_follows_followerId_followedId_key`(`followerId`, `followedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `body` TEXT NOT NULL,
    `href` VARCHAR(2048) NOT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'community',
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_readAt_createdAt_idx`(`userId`, `readAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plant_diseases` ADD CONSTRAINT `plant_diseases_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `plants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_diseases` ADD CONSTRAINT `plant_diseases_diseaseId_fkey` FOREIGN KEY (`diseaseId`) REFERENCES `diseases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `location_plants` ADD CONSTRAINT `location_plants_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `location_plants` ADD CONSTRAINT `location_plants_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `plants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scan_history` ADD CONSTRAINT `scan_history_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `field_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scan_history` ADD CONSTRAINT `scan_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scan_history` ADD CONSTRAINT `scan_history_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `plants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `field_sessions` ADD CONSTRAINT `field_sessions_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `local_names` ADD CONSTRAINT `local_names_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `plants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exhibitions` ADD CONSTRAINT `exhibitions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nature_catalogs` ADD CONSTRAINT `nature_catalogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `catalog_entries` ADD CONSTRAINT `catalog_entries_catalogId_fkey` FOREIGN KEY (`catalogId`) REFERENCES `nature_catalogs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exhibition_items` ADD CONSTRAINT `exhibition_items_exhibitionId_fkey` FOREIGN KEY (`exhibitionId`) REFERENCES `exhibitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exhibition_items` ADD CONSTRAINT `exhibition_items_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `plants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_identifications` ADD CONSTRAINT `community_identifications_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_identifications` ADD CONSTRAINT `community_identifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_post_likes` ADD CONSTRAINT `community_post_likes_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_post_likes` ADD CONSTRAINT `community_post_likes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_followedId_fkey` FOREIGN KEY (`followedId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

