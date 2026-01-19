import prisma from '../../prismaClient.js'
import {
  computeEnrollmentTimeState,
  getCourseTimeConfig,
} from '../../utils/courseTimeLimit.js'

// Returns a stable payload for client UI:
// {
//   isEnrolled: boolean,
//   enrollment: CourseEnroll | null,
//   expiresAt: string | null,
//   secondsRemaining: number | null,
//   canEnrollAt: string | null,
//   cooldownSecondsRemaining: number | null,
//   studyWindowMinutes: number,
//   reenrollCooldownMinutes: number,
// }

const getEnrollmentStatus = async (accountId, courseId) => {
  const now = new Date()
  const cfg = getCourseTimeConfig()

  // 1) Check active enrollment first.
  const active = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  if (active) {
    const st = computeEnrollmentTimeState(active, now, cfg)

    // If the active enrollment has expired (and is not Completed), kick it.
    if (!st.isCompleted && st.hasLimit && st.isExpired) {
      await prisma.courseEnroll.update({
        where: { Id: active.Id },
        data: { DeletedAt: st.expiresAt },
      })
    } else {
      return {
        isEnrolled: true,
        enrollment: active,
        expiresAt: st.expiresAt ? st.expiresAt.toISOString() : null,
        secondsRemaining: st.expiresAt ? st.secondsRemaining : null,
        canEnrollAt: null,
        cooldownSecondsRemaining: null,
        studyWindowMinutes: st.studyWindowMinutes,
        reenrollCooldownMinutes: st.reenrollCooldownMinutes,
      }
    }
  }

  // 2) No active enrollment. Compute cooldown from the most recent enrollment attempt.
  const latest = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
    },
    orderBy: { EnrolledAt: 'desc' },
  })

  if (!latest) {
    return {
      isEnrolled: false,
      enrollment: null,
      expiresAt: null,
      secondsRemaining: null,
      canEnrollAt: null,
      cooldownSecondsRemaining: null,
      studyWindowMinutes: cfg.studyWindowMinutes,
      reenrollCooldownMinutes: cfg.reenrollCooldownMinutes,
    }
  }

  const st = computeEnrollmentTimeState(latest, now, cfg)

  return {
    isEnrolled: false,
    enrollment: null,
    expiresAt: null,
    secondsRemaining: null,
    canEnrollAt: st.canEnrollAt ? st.canEnrollAt.toISOString() : null,
    cooldownSecondsRemaining: st.isCooldownActive ? st.cooldownSecondsRemaining : null,
    studyWindowMinutes: st.studyWindowMinutes,
    reenrollCooldownMinutes: st.reenrollCooldownMinutes,
  }
}

export default getEnrollmentStatus
