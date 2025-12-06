import prisma from "../../prismaClient.js";

export default async function create(data) {
  const { questionText, type, answer, courseId, lessonId, answers } = data;

  const normalizedType = String(type).trim();

  return prisma.$transaction(async (tx) => {
    const question = await tx.questionBank.create({
      data: {
        QuestionText: questionText,
        Type: normalizedType,
        Answer: normalizedType === "Essay" ? (answer ?? "") : null,
        courseId: courseId,
        LessonId: lessonId ?? null,
      },
    });

    if (normalizedType !== "Essay" && Array.isArray(answers)) {
      await tx.examAnswer.createMany({
        data: answers.map((a) => ({
          AnswerText: a.text,
          IsCorrect: !!a.isCorrect,
          QuestionId: question.Id,
        })),
      });
    }

    return tx.questionBank.findUnique({
      where: { Id: question.Id },
      include: { ExamAnswer: true },
    });
  });
}
