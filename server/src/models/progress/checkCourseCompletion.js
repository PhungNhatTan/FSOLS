import prisma from '../../prismaClient.js';
async function checkCourseCompletion(accountId, courseId) {
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
    },
    include: {
      lessonProgresses: true,
    },
  });

  if (!enrollment) return false;

  // Get total lessons in course
  const totalLessons = await prisma.courseLesson.count({
    where: {
      ModuleItem: {
        CourseModule: {
          CourseId: courseId,
        },
      },
      DeletedAt: null,
    },
  });

  // Count completed lessons
  const completedLessons = enrollment.lessonProgresses.filter(
    lp => lp.IsCompleted
  ).length;

  // Count completed exams
  const exams = await prisma.exam.findMany({
    where: { ModuleItem: { CourseModule: { CourseId: courseId } }, DeletedAt: null },
    include: { _count: { select: { ExamQuestion: true } } }
  });

  let passedExamsCount = 0;
  for (const exam of exams) {
    const passingScore = Math.ceil(exam._count.ExamQuestion * 0.8);
    const bestSubmission = await prisma.examSubmission.findFirst({
      where: { AccountId: accountId, ExamId: exam.Id, Score: { gte: passingScore } }
    });
    if (bestSubmission) passedExamsCount++;
  }

  return completedLessons === totalLessons && passedExamsCount === exams.length;
}

export default checkCourseCompletion;