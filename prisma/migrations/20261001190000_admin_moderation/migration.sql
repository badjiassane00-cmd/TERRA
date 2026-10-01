ALTER TABLE `users` MODIFY `role` ENUM('USER', 'INSTITUTION', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER';

CREATE TABLE `community_reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('POST', 'USER') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(80) NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('OPEN', 'REVIEWED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `community_reports_reporterId_targetType_targetId_key` (`reporterId`, `targetType`, `targetId`),
    INDEX `community_reports_status_createdAt_idx` (`status`, `createdAt`),
    INDEX `community_reports_targetType_targetId_idx` (`targetType`, `targetId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `community_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;