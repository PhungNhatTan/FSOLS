/*
  Warnings:

  - You are about to drop the column `ParentId` on the `courselesson` table. All the data in the column will be lost.
  - You are about to drop the column `CourseId` on the `exam` table. All the data in the column will be lost.
  - You are about to drop the column `ExamId` on the `moduleitem` table. All the data in the column will be lost.
  - Added the required column `ModuleItemId` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `courseenroll` DROP FOREIGN KEY `CourseEnroll_CourseId_fkey`;

-- DropForeignKey
ALTER TABLE `courselesson` DROP FOREIGN KEY `CourseLesson_ParentId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_CourseId_fkey`;

-- DropForeignKey
ALTER TABLE `moduleitem` DROP FOREIGN KEY `ModuleItem_ExamId_fkey`;

-- DropIndex
DROP INDEX `CourseEnroll_CourseId_fkey` ON `courseenroll`;

-- DropIndex
DROP INDEX `CourseLesson_ParentId_fkey` ON `courselesson`;

-- DropIndex
DROP INDEX `Exam_CourseId_fkey` ON `exam`;

-- DropIndex
DROP INDEX `ModuleItem_ExamId_fkey` ON `moduleitem`;

-- AlterTable
ALTER TABLE `courseenroll` ADD COLUMN `SpecializationId` INTEGER NULL,
    MODIFY `CourseId` INTEGER NULL;

-- AlterTable
ALTER TABLE `courselesson` DROP COLUMN `ParentId`;

-- AlterTable
ALTER TABLE `exam` DROP COLUMN `CourseId`,
    ADD COLUMN `ModuleItemId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `moduleitem` DROP COLUMN `ExamId`;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_ModuleItemId_fkey` FOREIGN KEY (`ModuleItemId`) REFERENCES `ModuleItem`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
