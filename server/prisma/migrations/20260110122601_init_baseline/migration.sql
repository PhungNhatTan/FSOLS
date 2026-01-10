-- CreateTable
CREATE TABLE `Account` (
    `Id` VARCHAR(191) NOT NULL,
    `Username` VARCHAR(191) NOT NULL,
    `DisplayName` VARCHAR(191) NOT NULL,
    `AvatarUrl` VARCHAR(191) NULL,
    `Bio` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Account_Username_key`(`Username`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `AccountRole` (
    `AccountId` VARCHAR(191) NOT NULL,
    `Role` ENUM('Mentor', 'Admin', 'Moderator') NOT NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mentor` (
    `AccountId` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NULL,
    `Email` VARCHAR(191) NULL,
    `Phone` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `AccountId` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `Course` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NOT NULL,
    `CreatedById` VARCHAR(191) NULL,
    `CategoryId` INTEGER NULL,
    `PublishedAt` DATETIME(3) NULL,
    `LastUpdated` DATETIME(3) NULL,
    `Draft` JSON NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Specialization` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `SpecializationCode` VARCHAR(191) NOT NULL,
    `SpecializationName` VARCHAR(191) NOT NULL,
    `CreatedById` VARCHAR(191) NULL,
    `CategoryId` INTEGER NULL,
    `PublishedAt` DATETIME(3) NULL,
    `LastUpdated` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Specialization_SpecializationCode_key`(`SpecializationCode`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationRequest` (
    `Id` VARCHAR(191) NOT NULL,
    `CourseId` INTEGER NULL,
    `SpecializationId` INTEGER NULL,
    `ReviewedById` VARCHAR(191) NULL,
    `DraftSnapshot` JSON NULL,
    `ApprovalStatus` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `Reason` VARCHAR(191) NULL,
    `RequestType` ENUM('New', 'Update') NOT NULL DEFAULT 'New',
    `ReviewedAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecializationCourse` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `SpecId` INTEGER NOT NULL,
    `CourseId` INTEGER NOT NULL,
    `OrderNo` INTEGER NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `SpecializationCourse_SpecId_CourseId_key`(`SpecId`, `CourseId`),
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
CREATE TABLE `CourseModule` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(191) NOT NULL DEFAULT 'Module Title',
    `CourseId` INTEGER NOT NULL,
    `OrderNo` INTEGER NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModuleItem` (
    `Id` VARCHAR(191) NOT NULL,
    `OrderNo` INTEGER NOT NULL,
    `EstimatedDuration` INTEGER NULL,
    `CourseModuleId` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

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
    `CreatedById` VARCHAR(191) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `CourseEnroll` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `AccountId` VARCHAR(191) NOT NULL,
    `CourseId` INTEGER NULL,
    `SpecializationId` INTEGER NULL,
    `Status` ENUM('Enrolled', 'InProgress', 'Completed') NOT NULL DEFAULT 'Enrolled',
    `EnrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `CompletedAt` DATETIME(3) NULL,
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
CREATE TABLE `Exam` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `ModuleItemId` VARCHAR(191) NOT NULL,
    `Title` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NOT NULL,
    `CreatedById` VARCHAR(191) NULL,
    `DurationPreset` ENUM('P_15', 'P_30', 'P_60', 'P_90', 'P_120') NULL,
    `DurationCustom` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

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
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamQuestion` (
    `Id` VARCHAR(191) NOT NULL,
    `ExamId` INTEGER NOT NULL,
    `QuestionId` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAnswer` (
    `Id` VARCHAR(191) NOT NULL,
    `AnswerText` VARCHAR(191) NOT NULL,
    `IsCorrect` BOOLEAN NOT NULL DEFAULT false,
    `QuestionId` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSubmission` (
    `Id` VARCHAR(191) NOT NULL,
    `ExamId` INTEGER NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `SubmittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Score` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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
CREATE TABLE `Certificate` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CertificateType` ENUM('Course', 'Specialization') NOT NULL,
    `CourseId` INTEGER NULL,
    `SpecializationId` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Certificate_CourseId_key`(`CourseId`),
    UNIQUE INDEX `Certificate_SpecializationId_key`(`SpecializationId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCertificate` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CertificateId` INTEGER NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `Id` VARCHAR(191) NOT NULL,
    `AccountId` VARCHAR(191) NOT NULL,
    `ParentId` VARCHAR(191) NULL,
    `ReplyId` VARCHAR(191) NULL,
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
ALTER TABLE `AccountSuspension` ADD CONSTRAINT `AccountSuspension_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_CategoryId_fkey` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialization` ADD CONSTRAINT `Specialization_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialization` ADD CONSTRAINT `Specialization_CategoryId_fkey` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_ReviewedById_fkey` FOREIGN KEY (`ReviewedById`) REFERENCES `Account`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecializationCourse` ADD CONSTRAINT `SpecializationCourse_SpecId_fkey` FOREIGN KEY (`SpecId`) REFERENCES `Specialization`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecializationCourse` ADD CONSTRAINT `SpecializationCourse_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseModule` ADD CONSTRAINT `CourseModule_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModuleItem` ADD CONSTRAINT `ModuleItem_CourseModuleId_fkey` FOREIGN KEY (`CourseModuleId`) REFERENCES `CourseModule`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_ModuleItemId_fkey` FOREIGN KEY (`ModuleItemId`) REFERENCES `ModuleItem`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonResource` ADD CONSTRAINT `LessonResource_LessonId_fkey` FOREIGN KEY (`LessonId`) REFERENCES `CourseLesson`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSkill` ADD CONSTRAINT `CourseSkill_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_CourseEnrollId_fkey` FOREIGN KEY (`CourseEnrollId`) REFERENCES `CourseEnroll`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_LessonId_fkey` FOREIGN KEY (`LessonId`) REFERENCES `CourseLesson`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_ModuleItemId_fkey` FOREIGN KEY (`ModuleItemId`) REFERENCES `ModuleItem`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `CourseReview` ADD CONSTRAINT `CourseReview_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseReview` ADD CONSTRAINT `CourseReview_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_SpecializationId_fkey` FOREIGN KEY (`SpecializationId`) REFERENCES `Specialization`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_CertificateId_fkey` FOREIGN KEY (`CertificateId`) REFERENCES `Certificate`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ParentId_fkey` FOREIGN KEY (`ParentId`) REFERENCES `Post`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ReplyId_fkey` FOREIGN KEY (`ReplyId`) REFERENCES `Post`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostRemoval` ADD CONSTRAINT `PostRemoval_PostId_fkey` FOREIGN KEY (`PostId`) REFERENCES `Post`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_SenderId_fkey` FOREIGN KEY (`SenderId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ReceiverId_fkey` FOREIGN KEY (`ReceiverId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
