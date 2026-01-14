import examSubmissionModel from "../../models/examSubmission/index.js";
import questionBankModel from "../../models/questionBank/index.js";
import progressModels from "../../models/progress/index.js";
import prisma from "../../prismaClient.js";

export default async function submitExam(req, res, next) {
  try {
    const { examId, answers } = req.body;

    // ✅ ALWAYS get accountId from JWT
    const accountId = req.user?.userId;

    if (!accountId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const submission = await examSubmissionModel.create(
      examId,
      accountId
    );

    let score = 0;
    let total = 0;

    for (const ans of answers) {
      const { questionId, answerId, answerIds, answer } = ans;

      const question = await questionBankModel.get(questionId);
      if (!question) continue;

      let isCorrect = null;
      let gainedScore = 0;

      if (question.Type === "Fill") {
        const correctAnswers = question.ExamAnswer.filter(a => a.IsCorrect);

        if (correctAnswers.length && answer) {
          const normalize = str =>
            str.trim().toLowerCase().replace(/\s+/g, " ");

          isCorrect = correctAnswers.some(
            a => normalize(a.AnswerText) === normalize(answer)
          );

          gainedScore = isCorrect ? 1 : 0;
        }

        score += gainedScore;
        total += 1;

        await examSubmissionModel.createStudentAnswer({
          SubmissionId: submission.Id,
          QuestionId: questionId,
          Answer: answer,
          IsCorrect: isCorrect,
          Score: gainedScore,
        });
      }

      else if (["MCQ", "TF"].includes(question.Type)) {
        const correctAnswers = question.ExamAnswer.filter(a => a.IsCorrect);

        if (correctAnswers.length === 1) {
          isCorrect = correctAnswers[0].Id === answerId;
          gainedScore = isCorrect ? 1 : 0;
        } else {
          const correctIds = correctAnswers.map(a => a.Id);
          const submittedIds = answerIds || [];

          const correctCount = submittedIds.filter(id =>
            correctIds.includes(id)
          ).length;

          const wrongCount = submittedIds.filter(id =>
            !correctIds.includes(id)
          ).length;

          if (correctCount === correctIds.length && wrongCount === 0) {
            isCorrect = true;
            gainedScore = 1;
          } else if (correctCount > 0) {
            isCorrect = null;
            gainedScore = correctCount / correctIds.length;
          } else {
            isCorrect = false;
            gainedScore = 0;
          }

          for (const ansId of submittedIds) {
            await examSubmissionModel.createStudentAnswer({
              SubmissionId: submission.Id,
              QuestionId: questionId,
              AnswerId: ansId,
              IsCorrect: null,
              Score: gainedScore,
            });
          }
        }

        score += gainedScore;
        total += 1;

        if (!answerIds) {
          await examSubmissionModel.createStudentAnswer({
            SubmissionId: submission.Id,
            QuestionId: questionId,
            AnswerId: answerId,
            IsCorrect: isCorrect,
            Score: gainedScore,
          });
        }
      }

      else if (question.Type === "Essay") {
        await examSubmissionModel.createStudentAnswer({
          SubmissionId: submission.Id,
          QuestionId: questionId,
          Answer: answer,
          IsCorrect: null,
          Score: null,
        });
      }
    }

    await examSubmissionModel.updateScore(submission.Id, score);

    const examData = await prisma.exam.findUnique({
      where: { Id: Number(examId) },
      include: {
        ModuleItem: {
          include: { CourseModule: true },
        },
      },
    });

    const courseId = examData?.ModuleItem?.CourseModule?.CourseId;
    if (courseId) {
      await progressModels.completeCourse(accountId, courseId);
    }

    res.status(201).json({
      message: "Submission recorded",
      submissionId: submission.Id,
      score,
      total,
    });
  } catch (error) {
    console.error("Error in submitExam controller:", error);
    next(error);
  }
}
