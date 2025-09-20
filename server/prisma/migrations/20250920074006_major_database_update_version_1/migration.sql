/*
  Warnings:

  - The primary key for the `account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `accountrole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `mentor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `post` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[Username]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `DisplayName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Username` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Description` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Name` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `accountrole` DROP FOREIGN KEY `AccountRole_AccountId_fkey`;

-- DropForeignKey
ALTER TABLE `admin` DROP FOREIGN KEY `Admin_AccountId_fkey`;

-- DropForeignKey
ALTER TABLE `courseenroll` DROP FOREIGN KEY `CourseEnroll_AccountId_fkey`;

-- DropForeignKey
ALTER TABLE `mentor` DROP FOREIGN KEY `Mentor_AccountId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_AccountId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_ParentId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_ReplyId_fkey`;

-- DropForeignKey
ALTER TABLE `usercertificate` DROP FOREIGN KEY `UserCertificate_AccountId_fkey`;

-- DropIndex
DROP INDEX `CourseEnroll_AccountId_fkey` ON `courseenroll`;

-- DropIndex
DROP INDEX `Post_AccountId_fkey` ON `post`;

-- DropIndex
DROP INDEX `Post_ParentId_fkey` ON `post`;

-- DropIndex
DROP INDEX `Post_ReplyId_fkey` ON `post`;

-- DropIndex
DROP INDEX `UserCertificate_AccountId_fkey` ON `usercertificate`;

-- AlterTable
ALTER TABLE `account` DROP PRIMARY KEY,
    ADD COLUMN `DisplayName` VARCHAR(191) NOT NULL,
    ADD COLUMN `Username` VARCHAR(191) NOT NULL,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `accountrole` DROP PRIMARY KEY,
    MODIFY `AccountId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`AccountId`);

-- AlterTable
ALTER TABLE `admin` DROP PRIMARY KEY,
    MODIFY `AccountId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`AccountId`);

-- AlterTable
ALTER TABLE `course` ADD COLUMN `Description` VARCHAR(191) NOT NULL,
    ADD COLUMN `Name` VARCHAR(191) NOT NULL,
    ADD COLUMN `PrerequisiteId` INTEGER NULL;

-- AlterTable
ALTER TABLE `courseenroll` MODIFY `AccountId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `mentor` DROP PRIMARY KEY,
    MODIFY `AccountId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`AccountId`);

-- AlterTable
ALTER TABLE `post` DROP PRIMARY KEY,
    MODIFY `Id` VARCHAR(191) NOT NULL,
    MODIFY `AccountId` VARCHAR(191) NOT NULL,
    MODIFY `ParentId` VARCHAR(191) NULL,
    MODIFY `ReplyId` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`Id`);

-- AlterTable
ALTER TABLE `usercertificate` MODIFY `AccountId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `AccountIdentifier` (
    `Id` VARCHAR(191) NOT NULL,
    `Identifier` VARCHAR(191) NOT NULL,
    `Secret` VARCHAR(191) NULL,
    `Verified` BOOLEAN NOT NULL DEFAULT false,
    `ProviderId` INTEGER NULL,
    `AccountId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AccountIdentifier_ProviderId_Identifier_key`(`ProviderId`, `Identifier`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provider` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Enabled` BOOLEAN NOT NULL DEFAULT true,
    `Config` JSON NULL,

    UNIQUE INDEX `Provider_Name_key`(`Name`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseModule` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `OrderNo` INTEGER NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModuleItem` (
    `Id` VARCHAR(191) NOT NULL,
    `OrderNo` INTEGER NOT NULL,
    `CourseModuleId` INTEGER NULL,
    `ExamId` INTEGER NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseLesson` (
    `Id` VARCHAR(191) NOT NULL,
    `Title` VARCHAR(191) NOT NULL,
    `LessonType` ENUM('Video', 'Document') NOT NULL,
    `VideoUrl` VARCHAR(191) NULL,
    `DocUrl` VARCHAR(191) NULL,
    `ModuleItemId` VARCHAR(191) NULL,
    `ParentId` VARCHAR(191) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exam` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,
    `Title` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NOT NULL,
    `DurationPreset` ENUM('P_15', 'P_30', 'P_60', 'P_90', 'P_120') NULL,
    `DurationCustom` INTEGER NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionBank` (
    `Id` VARCHAR(191) NOT NULL,
    `LessonId` VARCHAR(191) NULL,
    `QuestionText` VARCHAR(191) NOT NULL,
    `Type` ENUM('MCQ', 'Fill', 'Essay', 'TF') NOT NULL DEFAULT 'MCQ',
    `Answer` VARCHAR(191) NULL,
    `courseId` INTEGER NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamQuestion` (
    `Id` VARCHAR(191) NOT NULL,
    `ExamId` INTEGER NOT NULL,
    `QuestionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAnswer` (
    `Id` VARCHAR(191) NOT NULL,
    `AnswerText` VARCHAR(191) NOT NULL,
    `IsCorrect` BOOLEAN NOT NULL DEFAULT false,
    `QuestionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSubmission` (
    `Id` VARCHAR(191) NOT NULL,
    `ExamId` INTEGER NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `SubmittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Score` INTEGER NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentAnswer` (
    `Id` VARCHAR(191) NOT NULL,
    `SubmissionId` VARCHAR(191) NOT NULL,
    `QuestionId` VARCHAR(191) NOT NULL,
    `AnswerId` VARCHAR(191) NULL,
    `Answer` VARCHAR(191) NULL,
    `IsCorrect` BOOLEAN NULL,
    `Score` INTEGER NULL,
    `examQuestionId` VARCHAR(191) NULL,
    `examAnswerId` VARCHAR(191) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Account_Username_key` ON `Account`(`Username`);

-- AddForeignKey
ALTER TABLE `AccountIdentifier` ADD CONSTRAINT `AccountIdentifier_ProviderId_fkey` FOREIGN KEY (`ProviderId`) REFERENCES `Provider`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountIdentifier` ADD CONSTRAINT `AccountIdentifier_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountRole` ADD CONSTRAINT `AccountRole_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mentor` ADD CONSTRAINT `Mentor_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_PrerequisiteId_fkey` FOREIGN KEY (`PrerequisiteId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModuleItem` ADD CONSTRAINT `ModuleItem_CourseModuleId_fkey` FOREIGN KEY (`CourseModuleId`) REFERENCES `CourseModule`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModuleItem` ADD CONSTRAINT `ModuleItem_ExamId_fkey` FOREIGN KEY (`ExamId`) REFERENCES `Exam`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_ModuleItemId_fkey` FOREIGN KEY (`ModuleItemId`) REFERENCES `ModuleItem`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_ParentId_fkey` FOREIGN KEY (`ParentId`) REFERENCES `CourseLesson`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionBank` ADD CONSTRAINT `QuestionBank_LessonId_fkey` FOREIGN KEY (`LessonId`) REFERENCES `CourseLesson`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionBank` ADD CONSTRAINT `QuestionBank_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamQuestion` ADD CONSTRAINT `ExamQuestion_ExamId_fkey` FOREIGN KEY (`ExamId`) REFERENCES `Exam`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamQuestion` ADD CONSTRAINT `ExamQuestion_QuestionId_fkey` FOREIGN KEY (`QuestionId`) REFERENCES `QuestionBank`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAnswer` ADD CONSTRAINT `ExamAnswer_QuestionId_fkey` FOREIGN KEY (`QuestionId`) REFERENCES `QuestionBank`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSubmission` ADD CONSTRAINT `ExamSubmission_ExamId_fkey` FOREIGN KEY (`ExamId`) REFERENCES `Exam`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSubmission` ADD CONSTRAINT `ExamSubmission_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAnswer` ADD CONSTRAINT `StudentAnswer_SubmissionId_fkey` FOREIGN KEY (`SubmissionId`) REFERENCES `ExamSubmission`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAnswer` ADD CONSTRAINT `StudentAnswer_examQuestionId_fkey` FOREIGN KEY (`examQuestionId`) REFERENCES `ExamQuestion`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAnswer` ADD CONSTRAINT `StudentAnswer_examAnswerId_fkey` FOREIGN KEY (`examAnswerId`) REFERENCES `ExamAnswer`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ParentId_fkey` FOREIGN KEY (`ParentId`) REFERENCES `Post`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ReplyId_fkey` FOREIGN KEY (`ReplyId`) REFERENCES `Post`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
