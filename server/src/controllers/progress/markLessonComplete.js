// controllers/progress/markLessonComplete.js
import progressModels from '../../models/progress/index.js'

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
    const status = error && typeof error === 'object' && error.statusCode ? error.statusCode : 500
    const meta = error && typeof error === 'object' && error.meta ? error.meta : null
    console.error('[Progress] markLessonComplete error:', error)
    res.status(status).json({
      error: 'Failed to mark lesson complete',
      message: error?.message || 'Failed to mark lesson complete',
      code: error?.code,
      ...(meta && typeof meta === 'object' ? meta : {}),
    })
  }
}
