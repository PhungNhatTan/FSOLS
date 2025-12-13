import questionBankModel from '../../models/questionBank/index.js';

export default async function get(req, res, next) {
  try {
    const { id } = req.params;
    const qb = await questionBankModel.getByLesson(id);
    if (!qb) {
      return res.status(404).json({ error: "QuestionBank not found" });
    }
    res.json(qb);
  } catch (err) {
    next(err);
  }
}
