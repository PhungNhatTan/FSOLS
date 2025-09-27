import prisma from "../../prismaClient.js";

export default async function update(Id, data) {
    const allowedFields = ["AnswerText", "IsCorrect", "QuestionId"];
    const updateData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) =>
            allowedFields.includes(key) && value !== undefined
        )
    );

    return prisma.examAnswer.update({
        where: { Id },
        data: updateData,
    });
}
