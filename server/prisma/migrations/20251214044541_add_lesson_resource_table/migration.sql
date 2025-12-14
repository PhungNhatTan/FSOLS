-- AlterTable
ALTER TABLE `coursemodule` ADD COLUMN `Title` VARCHAR(191) NOT NULL DEFAULT 'Module Title';

-- CreateTable
CREATE TABLE `LessonResource` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `LessonId` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Url` VARCHAR(191) NOT NULL,
    `OrderNo` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LessonResource` ADD CONSTRAINT `LessonResource_LessonId_fkey` FOREIGN KEY (`LessonId`) REFERENCES `CourseLesson`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
