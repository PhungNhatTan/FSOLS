import questionBankModel from '../../models/questionBank/index.js';

export default async function get(req, res, next) {
  try {
    const { id } = req.params;
    const courseId = Number.parseInt(id ?? "", 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }
    const qb = await questionBankModel.getByCourse(courseId);
    res.json(qb || []);
  } catch (err) {
    next(err);
  }
}