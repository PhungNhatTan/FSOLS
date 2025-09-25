import examModel from "../../models/exam/index.js";

export default async function createExamController(req, res, next) {
  try {
    const exam = await examModel.create(req.body);
    res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
}
