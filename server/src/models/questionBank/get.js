import prisma from "../../prismaClient.js";

export default async function getQuestionBankById(id) {
  return prisma.questionBank.findUnique({
    where: { Id: id },
    select: {
      Id: true,
      QuestionText: true,
      Type: true,
      Answer: true, // for essay type
      ExamAnswer: {
        select: {
          Id: true,
          AnswerText: true,
          IsCorrect: true,
        },
      },
      LessonId: true,
      courseId: true,
    },
  });
}