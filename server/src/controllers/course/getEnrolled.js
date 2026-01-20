import courseModel from "../../models/course/index.js";

export default async function getEnrolled(req, res, next) {
  try {
    const accountId = req.user?.accountId || req.user?.userId;
    if (!accountId) return res.status(401).json({ message: "Unauthorized" });

    const course = await courseModel.getEnrolled(accountId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.json(course);
  } catch (err) {
    next(err);
  }
}
