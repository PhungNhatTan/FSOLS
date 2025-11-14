import prisma from "../../prismaClient";
export default async function create(examId, questionId) {
    return await prisma.examQuestion.create({
        data: {
            examId,
            questionId,
        },
    });
}
