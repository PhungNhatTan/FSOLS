-- AlterTable
ALTER TABLE `course` ADD COLUMN `IsVerified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `specialization` ADD COLUMN `IsVerified` BOOLEAN NOT NULL DEFAULT false;
