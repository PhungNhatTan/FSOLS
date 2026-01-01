import prisma from "../../prismaClient.js"

export default async function createSubmission(examId, accountId) {
    return prisma.examSubmission.create({
        data: {
            Exam: { connect: { Id: examId } },
            Account: { connect: { Id: accountId } },
        },
    })
}
