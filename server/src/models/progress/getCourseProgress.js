import prisma from "../../prismaClient.js";

async function getCourseProgress(accountId, courseId) {
  return await prisma.$transaction(async (tx) => {
    let enrollment = await tx.courseEnroll.findFirst({
      where: { AccountId: accountId, CourseId: courseId, DeletedAt: null },
    });

    if (!enrollment) {
      enrollment = await tx.courseEnroll.create({
        data: { AccountId: accountId, CourseId: courseId, Status: 'InProgress' },
      });
    }

    const lessonProgress = await tx.lessonProgress.findMany({
      where: { CourseEnrollId: enrollment.Id, IsCompleted: true },
      select: { LessonId: true },
    });

    const exams = await tx.exam.findMany({
      where: {
        ModuleItem: { CourseModule: { CourseId: courseId } },
        DeletedAt: null,
      },
      include: { _count: { select: { ExamQuestion: true } } },
    });

    const submissions = await tx.examSubmission.findMany({
      where: { AccountId: accountId },
      select: { ExamId: true, Score: true },
    });

    const completedExams = exams
      .filter(e =>
        submissions.some(s =>
          s.ExamId === e.Id &&
          s.Score >= Math.ceil(e._count.ExamQuestion * 0.8)
        )
      )
      .map(e => e.Id);

    return {
      enrollmentId: enrollment.Id,
      completedLessons: lessonProgress.map(l => l.LessonId),
      completedExams,
    };
  });
}


export default getCourseProgress;