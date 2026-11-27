/*
  Warnings:

  - You are about to drop the column `attributeRuleVersion` on the `plant_instances` table. All the data in the column will be lost.
  - You are about to drop the column `baseAttack` on the `plant_species` table. All the data in the column will be lost.
  - You are about to drop the column `baseDefense` on the `plant_species` table. All the data in the column will be lost.
  - You are about to drop the column `baseVitality` on the `plant_species` table. All the data in the column will be lost.
  - You are about to drop the column `rarity` on the `plant_species` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `plant_instances` DROP COLUMN `attributeRuleVersion`,
    ADD COLUMN `attributeVersion` VARCHAR(32) NULL;

-- AlterTable
ALTER TABLE `plant_species` DROP COLUMN `baseAttack`,
    DROP COLUMN `baseDefense`,
    DROP COLUMN `baseVitality`,
    DROP COLUMN `rarity`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deletionRequestedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('ACTIVE', 'DISABLED', 'PENDING_DELETION', 'DELETED') NOT NULL DEFAULT 'ACTIVE';
