// controllers/progress/markLessonComplete.js
import progressModels from "../../models/progress/index.js";

export default async function markLessonComplete(req, res) {
  try {
    const accountId = req.user.userId; // from authenticate middleware
    const { lessonId } = req.params;
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ error: "Missing enrollmentId" });
    }

    const progress = await progressModels.markLessonComplete(
      accountId,
      Number(enrollmentId),
      lessonId // keep as string if Lesson.Id is string
    );

    res.json(progress);
  } catch (error) {
    console.error("[Progress] markLessonComplete error:", error);
    res.status(500).json({
      error: "Failed to mark lesson complete",
      message: error.message,
    });
  }
}
