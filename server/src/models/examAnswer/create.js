import prisma from "../../prismaClient.js";

export default async function create(data) {
  return prisma.examAnswer.create({
    data: {
      ...(data.AnswerText !== undefined && { AnswerText: data.AnswerText }),
      ...(data.IsCorrect !== undefined && { IsCorrect: data.IsCorrect }),
      ...(data.QuestionId !== undefined && { QuestionId: data.QuestionId }),
    },
  });
}
