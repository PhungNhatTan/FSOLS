import prisma from "../../prismaClient.js";

export default async function getDetailedExamResult(id) {
    return prisma.examSubmission.findUnique({
        where: { Id: id },
        select: {
            AccountId: true,
            Score: true,
            SubmittedAt: true,
            Exam: {
                select: {
                    Title: true,
                },
            },
            StudentAnswer: {
                select: {
                    QuestionId: true,
                    AnswerId: true,
                    Answer: true,
                    IsCorrect: true,
                    ExamQuestion: {
                        select: {
                            QuestionBank: {
                                select: {
                                    QuestionText: true,
                                    Type: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}
