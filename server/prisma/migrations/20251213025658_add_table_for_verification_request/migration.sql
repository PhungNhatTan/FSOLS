/*
  Warnings:

  - You are about to drop the column `IsVerified` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `IsVerified` on the `specialization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `course` DROP COLUMN `IsVerified`,
    ADD COLUMN `LastUpdated` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `specialization` DROP COLUMN `IsVerified`,
    ADD COLUMN `LastUpdated` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `VerificationRequest` (
    `Id` VARCHAR(191) NOT NULL,
    `CourseId` INTEGER NULL,
    `SpecializationId` INTEGER NULL,
    `ReviewedById` VARCHAR(191) NULL,
    `ApprovalStatus` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `RequestType` ENUM('New', 'Update') NOT NULL DEFAULT 'New',
    `ReviewedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_ReviewedById_fkey` FOREIGN KEY (`ReviewedById`) REFERENCES `Account`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
