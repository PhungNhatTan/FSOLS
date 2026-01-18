import progressModels from "../../models/progress/index.js";

/**
 * Check whether the current user is allowed to take a given exam.
 *
 * Response shape (200):
 *  - { allowed: true, isFinalExam: boolean, finalExamId?: number }
 *  - { allowed: false, isFinalExam: true, code, message, missingExams, finalExamId }
 */
export default async function eligibility(req, res, next) {
  try {
    const examId = Number(req.params.id);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ message: "Invalid exam id" });
    }

    const accountId = req.user?.userId || req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const gate = await progressModels.checkFinalExamEligibility(accountId, examId);
    const isFinalExam =
      typeof gate.finalExamId === "number" && Number(gate.finalExamId) === Number(examId);

    if (gate.allowed) {
      return res.json({
        allowed: true,
        isFinalExam,
        finalExamId: gate.finalExamId ?? null,
      });
    }

    if (gate.reason === "PREREQ_NOT_MET") {
      return res.json({
        allowed: false,
        isFinalExam: true,
        message: "You must pass all module exams before taking the final exam.",
        code: "EXAM_PREREQUISITES_NOT_MET",
        missingExams: gate.missingExams,
        finalExamId: gate.finalExamId,
      });
    }

    if (gate.reason === "INVALID_EXAM_OR_COURSE") {
      return res.status(400).json({ message: "Invalid exam" });
    }

    // Fallback: deny with a generic reason.
    return res.status(403).json({
      message: "Exam is not available.",
      code: "EXAM_NOT_AVAILABLE",
    });
  } catch (err) {
    next(err);
  }
}
