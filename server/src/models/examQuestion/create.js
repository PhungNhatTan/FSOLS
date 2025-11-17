import prisma from "../../prismaClient.js";
export default async function create(examId, questionId) {
    return await prisma.examQuestion.create({
        data: {
            Exam: { connect: { id: examId } },
            QuestionBank: { connect: { id: questionId } },
        },
    });
}
