import prisma from "../../prismaClient.js";

export default async function createSubmission(examId, accountId) {
    return prisma.examSubmission.create({
        data: {
            Exam: { connect: { id: examId } },
            Account: { connect: { id: accountId } },
        },
    });
};
