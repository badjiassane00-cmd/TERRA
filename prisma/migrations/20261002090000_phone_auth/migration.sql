-- TiDB requires the indexed column to exist before the index is added.
ALTER TABLE `users`
  ADD COLUMN `authPhone` VARCHAR(20) NULL;

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_authPhone_key` (`authPhone`);
