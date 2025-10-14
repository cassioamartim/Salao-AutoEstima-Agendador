/*
  Warnings:

  - You are about to drop the column `clientUuid` on the `schedulings` table. All the data in the column will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userUuid,date]` on the table `schedulings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userUuid` to the `schedulings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `schedulings` DROP FOREIGN KEY `schedulings_clientUuid_fkey`;

-- DropIndex
DROP INDEX `schedulings_clientUuid_date_key` ON `schedulings`;

-- AlterTable
ALTER TABLE `schedulings` DROP COLUMN `clientUuid`,
    ADD COLUMN `userUuid` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `clients`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `confirmed_email` BOOLEAN NOT NULL DEFAULT false,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('CLIENT', 'ADMIN') NOT NULL DEFAULT 'CLIENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_uuid_key`(`uuid`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `schedulings_userUuid_date_key` ON `schedulings`(`userUuid`, `date`);

-- AddForeignKey
ALTER TABLE `schedulings` ADD CONSTRAINT `schedulings_userUuid_fkey` FOREIGN KEY (`userUuid`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;
