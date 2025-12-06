import prisma from "../../prismaClient.js";

export default async function getByCourse(courseId) {
  const numericCourseId = Number(courseId);
  if (Number.isNaN(numericCourseId)) {
    return [];
  }
  return prisma.questionBank.findMany({
    where: { courseId: numericCourseId },
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
