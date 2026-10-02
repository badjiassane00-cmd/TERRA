ALTER TABLE `users`
  ADD COLUMN `authPhone` VARCHAR(20) NULL,
  ADD UNIQUE INDEX `users_authPhone_key` (`authPhone`);
