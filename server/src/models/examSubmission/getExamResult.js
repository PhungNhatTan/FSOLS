import prisma from "../../prismaClient.js";

export default async function getExamResult(studentId, examId) {
    return prisma.examSubmission.findFirst({
        where: {
            AccountId: studentId,
            ExamId: examId,
        },
        select: {
            Id: true,
            SubmittedAt: true,
            Score: true,
        },
        orderBy: {
            Score: 'desc',
            SubmittedAt: 'desc',
        },
    });
}
