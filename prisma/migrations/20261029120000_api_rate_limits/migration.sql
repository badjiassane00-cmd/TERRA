CREATE TABLE `api_rate_limits` (
    `identifier` VARCHAR(64) NOT NULL,
    `windowStart` DATETIME(3) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    INDEX `api_rate_limits_windowStart_idx` (`windowStart`),
    PRIMARY KEY (`identifier`, `windowStart`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
