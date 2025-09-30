import answerModel from "../../models/examAnswer/index.js";

export default async function createAnswer(req, res, next) {
  try {
    const data = req.body;

    const answer = await answerModel.create(data);

    res.status(201).json({
      success: true,
      data: answer,
    });
  } catch (err) {
    next(err);
  }
}
