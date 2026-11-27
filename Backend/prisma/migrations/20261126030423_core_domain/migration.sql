-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `nickname` VARCHAR(64) NULL,
    `avatarAssetId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_identities` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('WECHAT_MINI_PROGRAM') NOT NULL,
    `providerSubject` VARCHAR(128) NOT NULL,
    `unionId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `auth_identities_userId_idx`(`userId`),
    UNIQUE INDEX `auth_identities_provider_providerSubject_key`(`provider`, `providerSubject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_families` (
    `id` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NULL,
    `chineseName` VARCHAR(64) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plant_families_scientificName_key`(`scientificName`),
    UNIQUE INDEX `plant_families_chineseName_key`(`chineseName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_genera` (
    `id` VARCHAR(191) NOT NULL,
    `familyId` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NULL,
    `chineseName` VARCHAR(64) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plant_genera_scientificName_key`(`scientificName`),
    INDEX `plant_genera_familyId_status_idx`(`familyId`, `status`),
    UNIQUE INDEX `plant_genera_familyId_chineseName_key`(`familyId`, `chineseName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_species` (
    `id` VARCHAR(191) NOT NULL,
    `genusId` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NOT NULL,
    `chineseName` VARCHAR(64) NOT NULL,
    `commonNames` JSON NOT NULL,
    `description` TEXT NOT NULL,
    `characteristics` JSON NULL,
    `baseAttack` INTEGER NULL,
    `baseDefense` INTEGER NULL,
    `baseVitality` INTEGER NULL,
    `baseCombatPower` INTEGER NOT NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY') NULL,
    `taxonomySource` VARCHAR(64) NOT NULL DEFAULT 'floraverse-seed',
    `taxonomyVersion` VARCHAR(32) NOT NULL DEFAULT '2026.11',
    `representativeAssetId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plant_species_scientificName_key`(`scientificName`),
    INDEX `plant_species_genusId_status_idx`(`genusId`, `status`),
    INDEX `plant_species_status_chineseName_idx`(`status`, `chineseName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` VARCHAR(191) NOT NULL,
    `kind` ENUM('USER_AVATAR', 'SPECIES_COVER', 'INSTANCE_COVER', 'CAPTURE_SOURCE') NOT NULL,
    `ownerUserId` VARCHAR(191) NULL,
    `storageProvider` ENUM('LOCAL', 'COS') NOT NULL,
    `bucket` VARCHAR(128) NULL,
    `objectKey` VARCHAR(512) NOT NULL,
    `publicUrl` VARCHAR(1024) NULL,
    `mimeType` VARCHAR(127) NULL,
    `sizeBytes` INTEGER NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `checksum` VARCHAR(128) NULL,
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assets_ownerUserId_createdAt_idx`(`ownerUserId`, `createdAt`),
    UNIQUE INDEX `assets_storageProvider_objectKey_key`(`storageProvider`, `objectKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_captures` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `speciesId` VARCHAR(191) NOT NULL,
    `sourceAssetId` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(128) NOT NULL,
    `capturedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `plant_captures_userId_capturedAt_idx`(`userId`, `capturedAt`),
    INDEX `plant_captures_userId_speciesId_idx`(`userId`, `speciesId`),
    UNIQUE INDEX `plant_captures_userId_idempotencyKey_key`(`userId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plant_instances` (
    `id` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `speciesId` VARCHAR(191) NOT NULL,
    `captureId` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(64) NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `experience` INTEGER NOT NULL DEFAULT 0,
    `quality` ENUM('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY') NULL,
    `attributeSeed` VARCHAR(64) NULL,
    `attributes` JSON NULL,
    `attributeRuleVersion` VARCHAR(32) NULL,
    `combatPower` INTEGER NULL,
    `coverAssetId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `capturedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plant_instances_captureId_key`(`captureId`),
    INDEX `plant_instances_ownerUserId_speciesId_idx`(`ownerUserId`, `speciesId`),
    INDEX `plant_instances_ownerUserId_status_capturedAt_idx`(`ownerUserId`, `status`, `capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_avatarAssetId_fkey` FOREIGN KEY (`avatarAssetId`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_identities` ADD CONSTRAINT `auth_identities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_genera` ADD CONSTRAINT `plant_genera_familyId_fkey` FOREIGN KEY (`familyId`) REFERENCES `plant_families`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_species` ADD CONSTRAINT `plant_species_genusId_fkey` FOREIGN KEY (`genusId`) REFERENCES `plant_genera`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_species` ADD CONSTRAINT `plant_species_representativeAssetId_fkey` FOREIGN KEY (`representativeAssetId`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_captures` ADD CONSTRAINT `plant_captures_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_captures` ADD CONSTRAINT `plant_captures_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `plant_species`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_captures` ADD CONSTRAINT `plant_captures_sourceAssetId_fkey` FOREIGN KEY (`sourceAssetId`) REFERENCES `assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_instances` ADD CONSTRAINT `plant_instances_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_instances` ADD CONSTRAINT `plant_instances_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `plant_species`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_instances` ADD CONSTRAINT `plant_instances_captureId_fkey` FOREIGN KEY (`captureId`) REFERENCES `plant_captures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plant_instances` ADD CONSTRAINT `plant_instances_coverAssetId_fkey` FOREIGN KEY (`coverAssetId`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
