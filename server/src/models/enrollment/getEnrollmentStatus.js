import prisma from '../../prismaClient.js'
import {
  computeCourseStudyWindow,
  computeEnrollmentTimeState,
  getCourseTimeConfig,
  loadCourseTimeLimitData,
} from '../../utils/courseTimeLimit.js'

// Returns a stable payload for client UI:
// {
//   isEnrolled: boolean,
//   enrollment: CourseEnroll | null,
//   expiresAt: string | null,
//   secondsRemaining: number | null,
//   canEnrollAt: string | null,
//   cooldownSecondsRemaining: number | null,
//   studyWindowSeconds: number,
//   studyWindowMinutes: number,
//   studyWindowDays: number,
//   reenrollCooldownSeconds: number,
//   reenrollCooldownMinutes: number,
//   reenrollCooldownDays: number,
// }

const getEnrollmentStatus = async (accountId, courseId) => {
  const now = new Date()
  const cfg = getCourseTimeConfig()

  // Compute per-course study window (seconds)
  const courseData = await loadCourseTimeLimitData(prisma, courseId)
  const courseWindow = computeCourseStudyWindow(courseData, cfg)
  const studyWindowSeconds = courseWindow.studyWindowSeconds

  // 1) Check active enrollment first.
  const active = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  if (active) {
    const st = computeEnrollmentTimeState(active, now, cfg, studyWindowSeconds)

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
        studyWindowSeconds: st.studyWindowSeconds,
        studyWindowMinutes: st.studyWindowMinutes,
        studyWindowDays: st.studyWindowDays,
        reenrollCooldownSeconds: st.reenrollCooldownSeconds,
        reenrollCooldownMinutes: st.reenrollCooldownMinutes,
        reenrollCooldownDays: st.reenrollCooldownDays,
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
    // Not enrolled and no history.
    const tmp = computeEnrollmentTimeState({ EnrolledAt: now, Status: 'Enrolled', DeletedAt: null }, now, cfg, studyWindowSeconds)

    return {
      isEnrolled: false,
      enrollment: null,
      expiresAt: null,
      secondsRemaining: null,
      canEnrollAt: null,
      cooldownSecondsRemaining: null,
      studyWindowSeconds: tmp.studyWindowSeconds,
      studyWindowMinutes: tmp.studyWindowMinutes,
      studyWindowDays: tmp.studyWindowDays,
      reenrollCooldownSeconds: tmp.reenrollCooldownSeconds,
      reenrollCooldownMinutes: tmp.reenrollCooldownMinutes,
      reenrollCooldownDays: tmp.reenrollCooldownDays,
    }
  }

  const st = computeEnrollmentTimeState(latest, now, cfg, studyWindowSeconds)

  return {
    isEnrolled: false,
    enrollment: null,
    expiresAt: null,
    secondsRemaining: null,
    canEnrollAt: st.canEnrollAt ? st.canEnrollAt.toISOString() : null,
    cooldownSecondsRemaining: st.isCooldownActive ? st.cooldownSecondsRemaining : null,
    studyWindowSeconds: st.studyWindowSeconds,
    studyWindowMinutes: st.studyWindowMinutes,
    studyWindowDays: st.studyWindowDays,
    reenrollCooldownSeconds: st.reenrollCooldownSeconds,
    reenrollCooldownMinutes: st.reenrollCooldownMinutes,
    reenrollCooldownDays: st.reenrollCooldownDays,
  }
}

export default getEnrollmentStatus
