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

  // Get total exams in course
  const totalExams = await prisma.exam.count({
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
  const completedExams = await prisma.examSubmission.count({
    where: {
      AccountId: accountId,
      Exam: {
        ModuleItem: {
          CourseModule: {
            CourseId: courseId,
          },
        },
      },
    },
  });

  return completedLessons === totalLessons && completedExams === totalExams;
}

export default checkCourseCompletion;