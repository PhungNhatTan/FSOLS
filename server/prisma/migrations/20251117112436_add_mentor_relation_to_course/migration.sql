/*
  Warnings:

  - Added the required column `CreatedById` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `course` ADD COLUMN `CreatedById` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE RESTRICT ON UPDATE CASCADE;
