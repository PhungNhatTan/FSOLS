-- AlterTable
ALTER TABLE `questionbank` MODIFY `QuestionText` TEXT NOT NULL,
    MODIFY `Answer` TEXT NULL;

-- CreateTable
CREATE TABLE `OtpToken` (
    `Id` VARCHAR(191) NOT NULL,
    `Purpose` ENUM('VerifyAccount', 'ResetPassword') NOT NULL,
    `CodeHash` VARCHAR(191) NOT NULL,
    `ExpiresAt` DATETIME(3) NOT NULL,
    `ConsumedAt` DATETIME(3) NULL,
    `Attempts` INTEGER NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `AccountIdentifierId` VARCHAR(191) NOT NULL,

    INDEX `OtpToken_AccountIdentifierId_Purpose_ConsumedAt_ExpiresAt_idx`(`AccountIdentifierId`, `Purpose`, `ConsumedAt`, `ExpiresAt`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OtpToken` ADD CONSTRAINT `OtpToken_AccountIdentifierId_fkey` FOREIGN KEY (`AccountIdentifierId`) REFERENCES `AccountIdentifier`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
