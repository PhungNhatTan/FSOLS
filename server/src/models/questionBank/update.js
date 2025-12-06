import prisma from "../../prismaClient.js";

export default async function updateQuestionBank(id, data) {
    return await prisma.questionBank.update({
        where: { id },
        data,
    });
}