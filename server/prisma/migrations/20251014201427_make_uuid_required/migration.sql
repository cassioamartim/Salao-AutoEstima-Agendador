-- AlterTable
ALTER TABLE `users` ADD COLUMN `ip_address` VARCHAR(45) NULL,
    ADD COLUMN `tag` VARCHAR(255) NULL,
    ADD COLUMN `utm_campaign` VARCHAR(255) NULL,
    ADD COLUMN `utm_content` VARCHAR(255) NULL,
    ADD COLUMN `utm_medium` VARCHAR(255) NULL,
    ADD COLUMN `utm_source` VARCHAR(255) NULL,
    ADD COLUMN `utm_term` VARCHAR(255) NULL;
