import prisma from '../../prismaClient.js';

async function markLessonComplete(accountId, enrollmentId, lessonId) {
  // Check if progress already exists
  const existing = await prisma.lessonProgress.findFirst({
    where: {
      AccountId: accountId,
      CourseEnrollId: enrollmentId,
      LessonId: lessonId,
    },
  });

  let progress;
  
  if (existing) {
    // Update existing progress
    progress = await prisma.lessonProgress.update({
      where: {
        Id: existing.Id,
      },
      data: {
        IsCompleted: true,
        CompletedAt: new Date(),
      },
    });
  } else {
    // Create new progress record
    progress = await prisma.lessonProgress.create({
      data: {
        AccountId: accountId,
        CourseEnrollId: enrollmentId,
        LessonId: lessonId,
        IsCompleted: true,
        CompletedAt: new Date(),
      },
    });
  }

  return progress;
}

export default markLessonComplete;