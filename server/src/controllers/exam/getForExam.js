import examModel from "../../models/exam/index.js";
import progressModels from "../../models/progress/index.js";

export default async function getForExam(req, res, next) {
  try {
    const { id } = req.params;

    // If a learner is authenticated, enforce prerequisite gating for the final exam.
    const accountId = req.user?.userId || req.user?.accountId;
    if (accountId) {
      const eligibility = await progressModels.checkFinalExamEligibility(accountId, Number(id));
      if (!eligibility.allowed && eligibility.reason === 'PREREQ_NOT_MET') {
        return res.status(403).json({
          message: 'You must pass all module exams before taking the final exam.',
          code: 'EXAM_PREREQUISITES_NOT_MET',
          missingExams: eligibility.missingExams,
          finalExamId: eligibility.finalExamId,
        });
      }
      if (!eligibility.allowed && eligibility.reason === 'INVALID_EXAM_OR_COURSE') {
        return res.status(400).json({ error: 'Invalid exam' });
      }
    }

    const qb = await examModel.getForExam(Number(id));
    if (!qb) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(qb);
  } catch (err) {
    next(err);
  }
}
