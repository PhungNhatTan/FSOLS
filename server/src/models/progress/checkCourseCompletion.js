import prisma from '../../prismaClient.js';
async function checkCourseCompletion(accountId, courseId) {
  // Only consider the active (not deleted/expired) enrollment.
  // If multiple enrollments exist, prefer the most recent.
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
    orderBy: { EnrolledAt: 'desc' },
    include: {
      lessonProgresses: {
        where: { IsCompleted: true },
        select: { Id: true },
      },
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
  const completedLessons = enrollment.lessonProgresses.length;

  // Count completed exams
  const exams = await prisma.exam.findMany({
    where: { ModuleItem: { CourseModule: { CourseId: courseId } }, DeletedAt: null },
    include: { _count: { select: { ExamQuestion: true } } }
  });

  if (exams.length === 0) {
    return completedLessons === totalLessons;
  }

  const examIds = exams.map((e) => e.Id);
  const submissions = await prisma.examSubmission.findMany({
    where: {
      AccountId: accountId,
      ExamId: { in: examIds },
      Score: { not: null },
    },
    select: { ExamId: true, Score: true },
  });

  const bestScoreByExamId = new Map();
  for (const s of submissions) {
    const prev = bestScoreByExamId.get(s.ExamId);
    if (prev === undefined || (s.Score ?? 0) > prev) {
      bestScoreByExamId.set(s.ExamId, s.Score ?? 0);
    }
  }

  let passedExamsCount = 0;
  for (const exam of exams) {
    const best = bestScoreByExamId.get(exam.Id);
    if (best === undefined) continue;

    const passingScore = Math.ceil(exam._count.ExamQuestion * 0.8);
    if (best >= passingScore) passedExamsCount++;
  }

  return completedLessons === totalLessons && passedExamsCount === exams.length;
}

export default checkCourseCompletion;
