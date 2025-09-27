import prisma from "../../prismaClient.js";

export default async function getByCourse(courseId) {
  return prisma.questionBank.findMany({
    where: { courseId },
    select: {
      Id: true,
      QuestionText: true,
      Type: true,
      Answer: true,
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
