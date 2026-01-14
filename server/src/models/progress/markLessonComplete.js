// models/progress/markLessonComplete.js
import prisma from "../../prismaClient.js";

async function markLessonComplete(accountId, enrollmentId, lessonId) {
  // ✅ Authorization + existence in ONE query
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      Id: enrollmentId,
      AccountId: accountId,
      DeletedAt: null
    }
  });

  if (!enrollment) {
    throw new Error("Enrollment not found or unauthorized");
  }

  return prisma.lessonProgress.upsert({
    where: {
      AccountId_CourseEnrollId_LessonId: {
        AccountId: accountId,
        CourseEnrollId: enrollment.Id,
        LessonId: lessonId
      }
    },
    update: {
      IsCompleted: true,
      CompletedAt: new Date()
    },
    create: {
      AccountId: accountId,
      CourseEnrollId: enrollment.Id,
      LessonId: lessonId,
      IsCompleted: true,
      CompletedAt: new Date()
    }
  });
}

export default markLessonComplete;
