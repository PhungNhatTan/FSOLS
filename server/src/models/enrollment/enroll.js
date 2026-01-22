import prisma from '../../prismaClient.js'
import {
  computeCourseStudyWindow,
  computeEnrollmentTimeState,
  formatDurationHMS,
  getCourseTimeConfig,
  loadCourseTimeLimitData,
} from '../../utils/courseTimeLimit.js'

/**
 * Enroll a user into a course
 */
const enroll = async (accountId, courseId) => {
  const now = new Date()
  const cfg = getCourseTimeConfig()

  // Compute per-course study window (seconds)
  const courseData = await loadCourseTimeLimitData(prisma, courseId)
  const courseWindow = computeCourseStudyWindow(courseData, cfg)
  const studyWindowSeconds = courseWindow.studyWindowSeconds

  // 1) If there is an active enrollment, check whether it has expired.
  const active = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  if (active) {
    const st = computeEnrollmentTimeState(active, now, cfg, studyWindowSeconds)

    // Completed enrollments are treated as still enrolled.
    if (st.isCompleted) {
      const err = new Error('Already enrolled in this course')
      err.statusCode = 409
      err.code = 'ALREADY_ENROLLED'
      throw err
    }

    // No time limit => always active.
    if (!st.hasLimit) {
      const err = new Error('Already enrolled in this course')
      err.statusCode = 409
      err.code = 'ALREADY_ENROLLED'
      throw err
    }

    if (!st.isExpired) {
      const err = new Error(`Already enrolled in this course. Time left: ${formatDurationHMS(st.secondsRemaining)}.`)
      err.statusCode = 409
      err.code = 'ALREADY_ENROLLED'
      err.meta = {
        expiresAt: st.expiresAt,
        secondsRemaining: st.secondsRemaining,
      }
      throw err
    }

    // Expired: kick out by marking DeletedAt at the true expiresAt.
    await prisma.courseEnroll.update({
      where: { Id: active.Id },
      data: { DeletedAt: st.expiresAt },
    })
  }

  // 2) Enforce cooldown based on the most recent enrollment attempt (including deleted).
  const latest = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
    },
    orderBy: {
      EnrolledAt: 'desc',
    },
  })

  if (latest) {
    const st = computeEnrollmentTimeState(latest, now, cfg, studyWindowSeconds)
    if (st.isCooldownActive) {
      const err = new Error(
        `You can't study this course after the time limit. You can enroll again in ${formatDurationHMS(
          st.cooldownSecondsRemaining
        )}.`
      )
      err.statusCode = 423
      err.code = 'REENROLL_COOLDOWN'
      err.meta = {
        canEnrollAt: st.canEnrollAt,
        secondsUntilCanEnroll: st.cooldownSecondsRemaining,
      }
      throw err
    }
  }

  // Create enrollment
  return prisma.courseEnroll.create({
    data: {
      AccountId: accountId,
      CourseId: courseId,
      Status: 'Enrolled',
    },
    include: {
      Course: {
        select: {
          Id: true,
          Name: true,
        },
      },
    },
  })
}

export default enroll
