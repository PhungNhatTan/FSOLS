/*
  Warnings:

  - A unique constraint covering the columns `[SpecializationId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `CertificateType` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `certificate` DROP FOREIGN KEY `Certificate_CourseId_fkey`;

-- AlterTable
ALTER TABLE `certificate` ADD COLUMN `CertificateType` ENUM('Course', 'Specialization') NOT NULL,
    ADD COLUMN `SpecializationId` INTEGER NULL,
    MODIFY `CourseId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Certificate_SpecializationId_key` ON `Certificate`(`SpecializationId`);

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
