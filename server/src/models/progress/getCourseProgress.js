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

  // Get all exam submissions for this course
  const examSubmissions = await prisma.examSubmission.findMany({
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
    include: {
      Exam: {
        select: {
          Id: true,
        },
      },
    },
  });

  return {
    enrollmentId: enrollment.Id,
    completedLessons: lessonProgress
      .filter(lp => lp.IsCompleted)
      .map(lp => lp.LessonId),
    completedExams: examSubmissions.map(es => es.Exam.Id),
  };
}

export default getCourseProgress;