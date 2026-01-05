import progressModels from '../../models/progress/index.js';

export default async function markLessonComplete(req, res) {
    try {
        const { lessonId } = req.params;
        const { enrollmentId } = req.body;
        const accountId = req.user.id;

        if (!enrollmentId) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'enrollmentId is required in request body'
            });
        }

        const progress = await progressModels.markLessonComplete(
            accountId,
            enrollmentId,
            lessonId
        );

        res.json({
            success: true,
            progress,
            message: 'Lesson marked as complete'
        });
    } catch (error) {
        console.error('[Progress] Mark lesson complete error:', error);
        res.status(500).json({
            error: 'Failed to mark lesson complete',
            message: error.message
        });
    }
}