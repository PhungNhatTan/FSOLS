-- CreateTable
CREATE TABLE `Account` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountRole` (
    `AccountId` INTEGER NOT NULL,
    `Role` ENUM('Mentor', 'Admin') NOT NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mentor` (
    `AccountId` INTEGER NOT NULL,
    `Active` BOOLEAN NOT NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `AccountId` INTEGER NOT NULL,
    `Active` BOOLEAN NOT NULL,

    PRIMARY KEY (`AccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseEnroll` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `AccountId` INTEGER NOT NULL,
    `CourseId` INTEGER NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CourseId` INTEGER NOT NULL,

    UNIQUE INDEX `Certificate_CourseId_key`(`CourseId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCertificate` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `CertificateId` INTEGER NOT NULL,
    `AccountId` INTEGER NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `AccountId` INTEGER NOT NULL,
    `ParentId` INTEGER NOT NULL,
    `ReplyId` INTEGER NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountRole` ADD CONSTRAINT `AccountRole_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mentor` ADD CONSTRAINT `Mentor_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnroll` ADD CONSTRAINT `CourseEnroll_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Course`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_CertificateId_fkey` FOREIGN KEY (`CertificateId`) REFERENCES `Certificate`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_AccountId_fkey` FOREIGN KEY (`AccountId`) REFERENCES `Account`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ParentId_fkey` FOREIGN KEY (`ParentId`) REFERENCES `Post`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ReplyId_fkey` FOREIGN KEY (`ReplyId`) REFERENCES `Post`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
