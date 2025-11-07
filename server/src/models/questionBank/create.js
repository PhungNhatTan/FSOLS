import prisma from "../../prismaClient.js";

export default async function create(data) {
  const { questionText, type, answer, courseId, lessonId, answers } = data;

  return await prisma.$transaction(async (tx) => {
    const question = await tx.questionBank.create({
      data: {
        QuestionText: questionText,
        Type: type,
        Answer: type === "Essay" ? answer ?? "" : null,
        courseId,
        LessonId: lessonId,
      },
    });

    if (type !== "Essay" && Array.isArray(answers) && answers.length > 0) {
      await tx.examAnswer.createMany({
        data: answers.map((a) => ({
          AnswerText: a.text,
          IsCorrect: a.isCorrect,
          QuestionId: question.Id,
        })),
      });
    }

    return await tx.questionBank.findUnique({
      where: { Id: question.Id },
      include: { ExamAnswer: true },
    });
  });
}
