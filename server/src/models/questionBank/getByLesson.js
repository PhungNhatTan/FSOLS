import prisma from "../../prismaClient.js";

export default async function getByLesson(lessonId) {
  return prisma.questionBank.findMany({
    where: { LessonId: lessonId },
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
