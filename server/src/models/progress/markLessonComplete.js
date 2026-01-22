import prisma from '../../prismaClient.js'
import {
  computeCourseStudyWindow,
  computeEnrollmentTimeState,
  formatDurationHMS,
  getCourseTimeConfig,
  loadCourseTimeLimitData,
} from '../../utils/courseTimeLimit.js'

async function markLessonComplete(accountId, enrollmentId, lessonId) {
  const now = new Date()
  const cfg = getCourseTimeConfig()

  // Authorization + existence
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      Id: enrollmentId,
      AccountId: accountId,
      DeletedAt: null,
    },
  })

  if (!enrollment) {
    const err = new Error('Enrollment not found or unauthorized')
    err.statusCode = 403
    err.code = 'NOT_ENROLLED'
    throw err
  }

  // Compute per-course study window (seconds)
  const courseData = await loadCourseTimeLimitData(prisma, enrollment.CourseId)
  const courseWindow = computeCourseStudyWindow(courseData, cfg)
  const studyWindowSeconds = courseWindow.studyWindowSeconds

  const st = computeEnrollmentTimeState(enrollment, now, cfg, studyWindowSeconds)

  // Enforce time limit (except Completed).
  if (!st.isCompleted && st.hasLimit && st.isExpired) {
    await prisma.courseEnroll.update({
      where: { Id: enrollment.Id },
      data: { DeletedAt: st.expiresAt },
    })

    const err = new Error(
      `You can't study this course after the time limit. You can enroll again in ${formatDurationHMS(
        st.cooldownSecondsRemaining
      )}.`
    )
    err.statusCode = 403
    err.code = 'COURSE_TIME_EXPIRED'
    err.meta = {
      canEnrollAt: st.canEnrollAt ? st.canEnrollAt.toISOString() : null,
      secondsUntilCanEnroll: st.cooldownSecondsRemaining,
    }
    throw err
  }

  return prisma.lessonProgress.upsert({
    where: {
      AccountId_CourseEnrollId_LessonId: {
        AccountId: accountId,
        CourseEnrollId: enrollment.Id,
        LessonId: lessonId,
      },
    },
    update: {
      IsCompleted: true,
      CompletedAt: new Date(),
    },
    create: {
      AccountId: accountId,
      CourseEnrollId: enrollment.Id,
      LessonId: lessonId,
      IsCompleted: true,
      CompletedAt: new Date(),
    },
  })
}

export default markLessonComplete
