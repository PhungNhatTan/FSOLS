-- AlterTable
ALTER TABLE `examanswer` MODIFY `AnswerText` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `questionbank` MODIFY `QuestionText` TEXT NOT NULL,
    MODIFY `Answer` TEXT NULL;

-- AlterTable
ALTER TABLE `studentanswer` MODIFY `Answer` TEXT NULL;
