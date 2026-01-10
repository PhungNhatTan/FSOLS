/*
  Warnings:

  - A unique constraint covering the columns `[AccountId,CourseEnrollId,LessonId]` on the table `LessonProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `CourseEmbedding` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,
    `Vector` JSON NOT NULL,

    UNIQUE INDEX `CourseEmbedding_CourseId_key`(`CourseId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `LessonProgress_AccountId_CourseEnrollId_LessonId_key` ON `LessonProgress`(`AccountId`, `CourseEnrollId`, `LessonId`);

-- AddForeignKey
ALTER TABLE `CourseEmbedding` ADD CONSTRAINT `CourseEmbedding_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
