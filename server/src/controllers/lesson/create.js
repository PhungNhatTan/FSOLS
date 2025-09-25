import lessonModel from "../../models/lesson/index.js";

export default async function createLesson(req, res, next) {
  try {
    const lesson = await lessonModel.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
}