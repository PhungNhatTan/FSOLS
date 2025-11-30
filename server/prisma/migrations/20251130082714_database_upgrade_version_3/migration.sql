-- AlterTable
ALTER TABLE `account` ADD COLUMN `AvatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `Bio` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `course` ADD COLUMN `CategoryId` INTEGER NULL,
    ADD COLUMN `PublishedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `courseenroll` ADD COLUMN `CompletedAt` DATETIME(3) NULL,
    ADD COLUMN `EnrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `Status` ENUM('Enrolled', 'InProgress', 'Completed') NOT NULL DEFAULT 'Enrolled';

-- AlterTable
ALTER TABLE `mentor` ADD COLUMN `Email` VARCHAR(191) NULL,
    ADD COLUMN `Name` VARCHAR(191) NULL,
    ADD COLUMN `Phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `specialization` ADD COLUMN `CategoryId` INTEGER NULL,
    ADD COLUMN `PublishedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `AccountSuspension` (
    `Id` VARCHAR(191) NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `Reason` VARCHAR(191) NOT NULL,
    `SuspendedBy` VARCHAR(191) NULL,
    `SuspendedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ResolvedAt` DATETIME(3) NULL,
    `ResolvedBy` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Slug` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Category_Name_key`(`Name`),
    UNIQUE INDEX `Category_Slug_key`(`Slug`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseSkill` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,
    `SkillName` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonProgress` (
    `Id` VARCHAR(191) NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `CourseEnrollId` INTEGER NOT NULL,
    `LessonId` VARCHAR(191) NOT NULL,
    `IsCompleted` BOOLEAN NOT NULL DEFAULT false,
    `CompletedAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseReview` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `Rating` INTEGER NOT NULL,
    `Comment` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostRemoval` (
    `Id` VARCHAR(191) NOT NULL,
    `PostId` VARCHAR(191) NOT NULL,
    `Reason` VARCHAR(191) NOT NULL,
    `RemovedBy` VARCHAR(191) NULL,
    `RemovedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `RestoredAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `Id` VARCHAR(191) NOT NULL,
    `SenderId` VARCHAR(191) NOT NULL,
    `ReceiverId` VARCHAR(191) NOT NULL,
    `Content` VARCHAR(191) NOT NULL,
    `IsRead` BOOLEAN NOT NULL DEFAULT false,
    `ReadAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `Id` VARCHAR(191) NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `Type` VARCHAR(191) NOT NULL,
    `Title` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NOT NULL,
    `AttachmentUrl` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `ResolvedAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountSuspension` ADD CONSTRAINT `AccountSuspension_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_CategoryId_fkey` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialization` ADD CONSTRAINT `Specialization_CategoryId_fkey` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSkill` ADD CONSTRAINT `CourseSkill_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_CourseEnrollId_fkey` FOREIGN KEY (`CourseEnrollId`) REFERENCES `CourseEnroll`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_LessonId_fkey` FOREIGN KEY (`LessonId`) REFERENCES `CourseLesson`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseReview` ADD CONSTRAINT `CourseReview_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseReview` ADD CONSTRAINT `CourseReview_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostRemoval` ADD CONSTRAINT `PostRemoval_PostId_fkey` FOREIGN KEY (`PostId`) REFERENCES `Post`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_SenderId_fkey` FOREIGN KEY (`SenderId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ReceiverId_fkey` FOREIGN KEY (`ReceiverId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
