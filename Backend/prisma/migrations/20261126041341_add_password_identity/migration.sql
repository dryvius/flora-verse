-- AlterTable
ALTER TABLE `auth_identities` ADD COLUMN `passwordHash` VARCHAR(255) NULL,
    MODIFY `provider` ENUM('WECHAT_MINI_PROGRAM', 'PASSWORD') NOT NULL;
