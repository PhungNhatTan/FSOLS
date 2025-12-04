import examModel from "../../models/exam/index.js";

export default async function getForExam(req, res, next) {
  try {
    const { id } = req.params;
    const qb = await examModel.getForExam(Number(id));
    if (!qb) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(qb);
  } catch (err) {
    next(err);
  }
}
