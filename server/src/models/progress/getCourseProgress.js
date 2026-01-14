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

    const examIds = exams.map(e => e.Id);

    const submissions = await tx.examSubmission.findMany({
      where: {
        AccountId: accountId,
        ExamId: { in: examIds },
      },
      select: { ExamId: true, Score: true },
    });

    const completedExams = exams
      .filter(exam => {
        const submission = submissions.find(s => s.ExamId === exam.Id);
        if (!submission) return false;

        const passScore = Math.ceil(exam._count.ExamQuestion * 0.8);
        return submission.Score >= passScore;
      })
      .map(exam => exam.Id);

    return {
      enrollmentId: enrollment.Id,
      completedLessons: lessonProgress.map(l => l.LessonId),
      completedExams,
    };
  });
}


export default getCourseProgress;