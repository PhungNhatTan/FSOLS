-- DropForeignKey
ALTER TABLE `course` DROP FOREIGN KEY `Course_CreatedById_fkey`;

-- DropIndex
DROP INDEX `Course_CreatedById_fkey` ON `course`;

-- AlterTable
ALTER TABLE `accountrole` MODIFY `Role` ENUM('Mentor', 'Admin', 'Moderator') NOT NULL;

-- AlterTable
ALTER TABLE `course` MODIFY `CreatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `courselesson` ADD COLUMN `CreatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `exam` ADD COLUMN `CreatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `specialization` ADD COLUMN `CreatedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialization` ADD CONSTRAINT `Specialization_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_CreatedById_fkey` FOREIGN KEY (`CreatedById`) REFERENCES `Mentor`(`AccountId`) ON DELETE SET NULL ON UPDATE CASCADE;
