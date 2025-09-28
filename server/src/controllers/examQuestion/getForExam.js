import examQuestionModel from "../../models/examQuestion/index.js";

export default async function getForExam(req, res, next) {
  try {
    const { id } = req.params;
    const qb = await examQuestionModel.getForExam(id);
    if (!qb) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(qb);
  } catch (err) {
    next(err);
  }
}
