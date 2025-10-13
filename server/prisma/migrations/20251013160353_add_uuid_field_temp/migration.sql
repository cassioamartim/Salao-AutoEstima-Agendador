/*
  Warnings:

  - A unique constraint covering the columns `[clientUuid,date]` on the table `schedulings` will be added. If there are existing duplicate values, this will fail.
  - Made the column `uuid` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `schedulings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientUuid` on table `schedulings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `serviceUuid` on table `schedulings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `services` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `schedulings` DROP FOREIGN KEY `schedulings_clientUuid_fkey`;

-- DropForeignKey
ALTER TABLE `schedulings` DROP FOREIGN KEY `schedulings_serviceUuid_fkey`;

-- DropIndex
DROP INDEX `schedulings_clientUuid_fkey` ON `schedulings`;

-- DropIndex
DROP INDEX `schedulings_serviceUuid_fkey` ON `schedulings`;

-- AlterTable
ALTER TABLE `clients` MODIFY `uuid` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `schedulings` MODIFY `uuid` VARCHAR(191) NOT NULL,
    MODIFY `clientUuid` VARCHAR(191) NOT NULL,
    MODIFY `serviceUuid` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `services` MODIFY `uuid` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `schedulings_clientUuid_date_key` ON `schedulings`(`clientUuid`, `date`);

-- AddForeignKey
ALTER TABLE `schedulings` ADD CONSTRAINT `schedulings_clientUuid_fkey` FOREIGN KEY (`clientUuid`) REFERENCES `clients`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedulings` ADD CONSTRAINT `schedulings_serviceUuid_fkey` FOREIGN KEY (`serviceUuid`) REFERENCES `services`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;
