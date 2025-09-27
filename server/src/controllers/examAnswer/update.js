import answerModel from "../../models/answer/index.js";

export default async function updateAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    const answer = await answerModel.update({ Id: id, ...data });

    res.json({
      success: true,
      data: answer,
    });
  } catch (err) {
    next(err);
  }
}
