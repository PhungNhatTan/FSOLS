import prisma from "../../prismaClient.js";

export default async function getForExam(examId) {
    const exam = await prisma.exam.findUnique({
        where: { Id: examId },
        select: {
            Id: true,
            Title: true,
            DurationPreset: true,
            DurationCustom: true,
            ExamQuestion: {
                where: { DeletedAt: null },
                select: {
                    Id: true,
                    QuestionBank: {
                        select: {
                            Id: true,
                            QuestionText: true,
                            Type: true,
                            ExamAnswer: {
                                where: { DeletedAt: null },
                                select: { Id: true, AnswerText: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!exam) {
        return null
    };

    return {
        ExamId: exam.Id,
        Title: exam.Title,
        Duration: exam.DurationCustom ?? exam.DurationPreset,
        Questions: exam.ExamQuestion.map((q) => ({
            ExamQuestionId: q.Id,
            QuestionBankId: q.QuestionBank.Id,
            QuestionText: q.QuestionBank.QuestionText,
            Type: q.QuestionBank.Type,
            Answers: q.QuestionBank.ExamAnswer.map((a) => ({
                AnswerId: a.Id,
                AnswerText: a.AnswerText,
            })),
        })),
    };
}
