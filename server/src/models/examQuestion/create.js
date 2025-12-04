import prisma from "../../prismaClient.js";
export default async function create(examId, questionId) {
    return await prisma.examQuestion.create({
        data: {
            ExamId: examId,
            QuestionId: questionId,
        },
    });
}
