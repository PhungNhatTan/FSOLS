-- CreateTable
CREATE TABLE `CourseEmbedding` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,
    `Vector` JSON NOT NULL,

    UNIQUE INDEX `CourseEmbedding_CourseId_key`(`CourseId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CourseEmbedding` ADD CONSTRAINT `CourseEmbedding_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
