import answerModel from "../../models/examAnswer/index.js";

export default async function deleteAnswer(req, res, next) {
  try {
    const { id } = req.params;

    const answer = await answerModel.delete(id);

    res.json({
      success: true,
      message: "Answer soft-deleted successfully",
      data: answer,
    });
  } catch (err) {
    next(err);
  }
}
