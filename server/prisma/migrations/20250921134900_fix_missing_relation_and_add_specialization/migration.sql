/*
  Warnings:

  - You are about to drop the column `PrerequisiteId` on the `course` table. All the data in the column will be lost.
  - Added the required column `CourseId` to the `CourseModule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `course` DROP FOREIGN KEY `Course_PrerequisiteId_fkey`;

-- DropIndex
DROP INDEX `Course_PrerequisiteId_fkey` ON `course`;

-- AlterTable
ALTER TABLE `course` DROP COLUMN `PrerequisiteId`;

-- AlterTable
ALTER TABLE `coursemodule` ADD COLUMN `CourseId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Specialization` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `SpecializationCode` VARCHAR(191) NOT NULL,
    `SpecializationName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Specialization_SpecializationCode_key`(`SpecializationCode`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecializationCourse` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `SpecId` INTEGER NOT NULL,
    `CourseId` INTEGER NOT NULL,
    `OrderNo` INTEGER NOT NULL,

    UNIQUE INDEX `SpecializationCourse_SpecId_CourseId_key`(`SpecId`, `CourseId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpecializationCourse` ADD CONSTRAINT `SpecializationCourse_SpecId_fkey` FOREIGN KEY (`SpecId`) REFERENCES `Specialization`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecializationCourse` ADD CONSTRAINT `SpecializationCourse_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseModule` ADD CONSTRAINT `CourseModule_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
