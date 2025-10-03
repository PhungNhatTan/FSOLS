import prisma from "../../prismaClient.js";

export default async function createSubmission(examId, accountId) {
    return prisma.examSubmission.create({
        data: { ExamId: examId, AccountId: accountId },
    });
};
