import progressModels from "../../models/progress/index.js";

export default async function completeCourse(req, res) {
  try {
    const { courseId } = req.params;
    const accountId = req.user.userId;

    const parsedCourseId = parseInt(courseId, 10);
    if (Number.isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "Invalid courseId" });
    }

    const result = await progressModels.completeCourse(accountId, parsedCourseId);
    return res.json({ courseId: parsedCourseId, ...result });
  } catch (error) {
    console.error("[Progress] Complete course error:", error);
    return res.status(500).json({
      error: "Failed to complete course",
      message: error.message,
    });
  }
}
