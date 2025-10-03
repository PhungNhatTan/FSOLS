import examSubmissionModel from "../../models/examSubmission/index.js";
import questionBankModel from "../../models/questionBank/index.js";

export default async function submitExam(req, res, next) {
    try {
        const { examId, accountId, answers } = req.body;

        const submission = await examSubmissionModel.create(examId, accountId);

        let score = 0;
        let total = 0;

        for (const ans of answers) {
            const { questionId, answerId, answerIds, answer } = ans;

            const question = await questionBankModel.get(questionId);
            if (!question) {
                continue;
            };

            let isCorrect = null;
            let gainedScore = 0;

            if (["MCQ", "TF", "Fill"].includes(question.Type)) {
                const correctAnswers = question.ExamAnswer.filter((a) => a.IsCorrect);

                if (correctAnswers.length === 1) {
                    isCorrect = correctAnswers[0].Id === answerId;
                    gainedScore = isCorrect ? 1 : 0;
                } else {
                    const correctIds = correctAnswers.map((a) => a.Id);
                    const submittedIds = answerIds || [];

                    const correctCount = correctIds.filter((id) =>
                        submittedIds.includes(id)
                    ).length;
                    const wrongCount = submittedIds.filter(
                        (id) => !correctIds.includes(id)
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
            } else if (question.Type === "Essay") {
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

        res.status(201).json({
            message: "Submission recorded",
            submissionId: submission.Id,
            score,
            total,
        });
    } catch (error) {
        console.error("Error in submitExam controller:", error);
        res.status(500).json({ error: "Internal server error" });
        next(error);
    }
}
