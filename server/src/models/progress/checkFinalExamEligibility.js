import prisma from '../../prismaClient.js';

/**
 * Determines whether an account is allowed to take (load/submit) a given exam.
 *
 * Business rule:
 *   - The "final course exam" is defined as the last exam in the course's ordered content,
 *     using (CourseModule.OrderNo, ModuleItem.OrderNo, Exam.Id) ascending.
 *   - A learner may only take the final exam after passing *all other* exams in the course.
 *
 * Passing rule (aligned with existing progress logic):
 *   - Pass if there exists an ExamSubmission with Score >= ceil(questionCount * 0.8).
 */
export default async function checkFinalExamEligibility(accountId, examId) {
  const exam = await prisma.exam.findUnique({
    where: { Id: Number(examId) },
    select: {
      Id: true,
      ModuleItem: {
        select: {
          CourseModule: {
            select: { CourseId: true },
          },
        },
      },
    },
  });

  const courseId = exam?.ModuleItem?.CourseModule?.CourseId;
  if (!courseId) {
    return {
      allowed: false,
      reason: 'INVALID_EXAM_OR_COURSE',
      courseId: null,
      finalExamId: null,
      missingExams: [],
    };
  }

  // Fetch all exams in this course with ordering information.
  const courseExams = await prisma.exam.findMany({
    where: {
      DeletedAt: null,
      ModuleItem: {
        DeletedAt: null,
        CourseModule: {
          DeletedAt: null,
          CourseId: courseId,
        },
      },
    },
    select: {
      Id: true,
      Title: true,
      ModuleItem: {
        select: {
          OrderNo: true,
          CourseModule: {
            select: {
              OrderNo: true,
            },
          },
        },
      },
      _count: {
        select: { ExamQuestion: true },
      },
    },
  });

  if (!courseExams.length) {
    return {
      allowed: true,
      reason: null,
      courseId,
      finalExamId: null,
      missingExams: [],
    };
  }

  const ordered = [...courseExams].sort((a, b) => {
    const am = a.ModuleItem?.CourseModule?.OrderNo ?? 0;
    const bm = b.ModuleItem?.CourseModule?.OrderNo ?? 0;
    if (am !== bm) return am - bm;
    const ai = a.ModuleItem?.OrderNo ?? 0;
    const bi = b.ModuleItem?.OrderNo ?? 0;
    if (ai !== bi) return ai - bi;
    return (a.Id ?? 0) - (b.Id ?? 0);
  });

  const finalExamId = ordered[ordered.length - 1].Id;

  // Only gate the final exam.
  if (Number(examId) !== Number(finalExamId)) {
    return {
      allowed: true,
      reason: null,
      courseId,
      finalExamId,
      missingExams: [],
    };
  }

  const prereqExams = ordered.filter((e) => Number(e.Id) !== Number(finalExamId));
  if (!prereqExams.length) {
    return {
      allowed: true,
      reason: null,
      courseId,
      finalExamId,
      missingExams: [],
    };
  }

  // Fetch all submissions for prerequisite exams in one query.
  const prereqIds = prereqExams.map((e) => e.Id);
  const submissions = await prisma.examSubmission.findMany({
    where: {
      AccountId: accountId,
      ExamId: { in: prereqIds },
      Score: { not: null },
    },
    select: {
      ExamId: true,
      Score: true,
    },
  });

  const bestByExam = new Map();
  for (const s of submissions) {
    const prev = bestByExam.get(s.ExamId);
    if (prev === undefined || (s.Score ?? 0) > prev) {
      bestByExam.set(s.ExamId, s.Score ?? 0);
    }
  }

  const missingExams = [];
  for (const e of prereqExams) {
    const qCount = e._count?.ExamQuestion ?? 0;
    const passingScore = Math.ceil(qCount * 0.8);
    // If an exam has no questions configured, do not block progression.
    if (passingScore <= 0) continue;

    const best = bestByExam.get(e.Id) ?? null;
    if (best === null || best < passingScore) {
      missingExams.push({ Id: e.Id, Title: e.Title, passingScore, questionCount: qCount });
    }
  }

  if (missingExams.length) {
    return {
      allowed: false,
      reason: 'PREREQ_NOT_MET',
      courseId,
      finalExamId,
      missingExams,
    };
  }

  return {
    allowed: true,
    reason: null,
    courseId,
    finalExamId,
    missingExams: [],
  };
}
