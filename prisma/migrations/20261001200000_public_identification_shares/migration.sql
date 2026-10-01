ALTER TABLE `community_posts`
    ADD COLUMN `publicShareEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `identificationProbability` DOUBLE NULL;
