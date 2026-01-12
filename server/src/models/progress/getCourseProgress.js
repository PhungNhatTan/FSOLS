import prisma from "../../prismaClient.js";

async function getCourseProgress(accountId, courseId) {
  // Get or create enrollment
  let enrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  });

  if (!enrollment) {
    // Auto-enroll user when they start studying
    enrollment = await prisma.courseEnroll.create({
      data: {
        AccountId: accountId,
        CourseId: courseId,
        Status: 'InProgress',
      },
    });
  }

  // Get all lesson progress
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      CourseEnrollId: enrollment.Id,
    },
  });

  // Get all passed exam submissions for this course
  const examsWithQuestions = await prisma.exam.findMany({
    where: { ModuleItem: { CourseModule: { CourseId: courseId } }, DeletedAt: null },
    include: { _count: { select: { ExamQuestion: true } } }
  });

  const completedExams = [];
  for (const exam of examsWithQuestions) {
    const passingScore = Math.ceil(exam._count.ExamQuestion * 0.8);
    const passed = await prisma.examSubmission.findFirst({
      where: { AccountId: accountId, ExamId: exam.Id, Score: { gte: passingScore } }
    });
    if (passed) completedExams.push(exam.Id);
  }

  return {
    enrollmentId: enrollment.Id,
    completedLessons: lessonProgress
      .filter(lp => lp.IsCompleted)
      .map(lp => lp.LessonId),
    completedExams: completedExams,
  };
}

export default getCourseProgress;