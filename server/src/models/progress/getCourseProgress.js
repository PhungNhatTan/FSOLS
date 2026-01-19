import prisma from '../../prismaClient.js'
import {
  computeEnrollmentTimeState,
  formatDurationHMS,
  getCourseTimeConfig,
} from '../../utils/courseTimeLimit.js'

async function getCourseProgress(accountId, courseId) {
  const now = new Date()
  const cfg = getCourseTimeConfig()

  return await prisma.$transaction(async (tx) => {
    let enrollment = await tx.courseEnroll.findFirst({
      where: { AccountId: accountId, CourseId: courseId, DeletedAt: null },
    })

    // If enrolled but time expired, kick the student and fall through to cooldown handling.
    if (enrollment) {
      const st = computeEnrollmentTimeState(enrollment, now, cfg)
      if (!st.isCompleted && st.hasLimit && st.isExpired) {
        await tx.courseEnroll.update({
          where: { Id: enrollment.Id },
          data: { DeletedAt: st.expiresAt },
        })
        enrollment = null
      }
    }

    if (!enrollment) {
      // Not actively enrolled. If still in cooldown from the most recent attempt, return a locked error.
      const latest = await tx.courseEnroll.findFirst({
        where: { AccountId: accountId, CourseId: courseId },
        orderBy: { EnrolledAt: 'desc' },
      })

      if (latest) {
        const st = computeEnrollmentTimeState(latest, now, cfg)
        if (st.isCooldownActive) {
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
      }

      const err = new Error('You must enroll in this course before studying.')
      err.statusCode = 403
      err.code = 'NOT_ENROLLED'
      throw err
    }

    // If first time studying, switch to InProgress.
    if (enrollment.Status === 'Enrolled') {
      await tx.courseEnroll.update({
        where: { Id: enrollment.Id },
        data: { Status: 'InProgress' },
      })
    }

    const st = computeEnrollmentTimeState(enrollment, now, cfg)

    const lessonProgress = await tx.lessonProgress.findMany({
      where: { CourseEnrollId: enrollment.Id, IsCompleted: true },
      select: { LessonId: true },
    })

    const exams = await tx.exam.findMany({
      where: {
        ModuleItem: { CourseModule: { CourseId: courseId } },
        DeletedAt: null,
      },
      include: { _count: { select: { ExamQuestion: true } } },
    })

    const examIds = exams.map((e) => e.Id)

    const submissions = await tx.examSubmission.findMany({
      where: {
        AccountId: accountId,
        ExamId: { in: examIds },
      },
      select: { ExamId: true, Score: true },
    })

    const completedExams = exams
      .filter((exam) => {
        const submission = submissions.find((s) => s.ExamId === exam.Id)
        if (!submission) return false

        const passScore = Math.ceil(exam._count.ExamQuestion * 0.8)
        return submission.Score >= passScore
      })
      .map((exam) => exam.Id)

    return {
      enrollmentId: enrollment.Id,
      completedLessons: lessonProgress.map((l) => l.LessonId),
      completedExams,
      timeLimit: {
        expiresAt: st.expiresAt ? st.expiresAt.toISOString() : null,
        secondsRemaining: st.expiresAt ? st.secondsRemaining : null,
        studyWindowMinutes: st.studyWindowMinutes,
        reenrollCooldownMinutes: st.reenrollCooldownMinutes,
      },
    }
  })
}

export default getCourseProgress
