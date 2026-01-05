/*
  Warnings:

  - A unique constraint covering the columns `[AccountId,CourseEnrollId,LessonId]` on the table `LessonProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `LessonProgress_AccountId_CourseEnrollId_LessonId_key` ON `LessonProgress`(`AccountId`, `CourseEnrollId`, `LessonId`);
