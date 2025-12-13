import prisma from "../../prismaClient.js";

export default async function getForExam(examId) {
    const questions = await prisma.examQuestion.findMany({
        where: {
            ExamId: parseInt(examId),
            DeletedAt: null,
            QuestionBank: {
                DeletedAt: null
            },
        },
        select: {
            Id: true,
            QuestionBank: {
                select: {
                    Id: true,
                    QuestionText: true,
                    Type: true,
                    ExamAnswer: {
                        where: {
                            DeletedAt: null
                        },
                        select: {
                            Id: true,
                            AnswerText: true
                        },
                    },
                },
            },
        },
    });

    return questions.map((q) => ({
        Id: q.Id,
        QuestionBankId: q.QuestionBank.Id,
        QuestionText: q.QuestionBank.QuestionText,
        Type: q.QuestionBank.Type,
        Answers: q.QuestionBank.ExamAnswer,
    }));
}
