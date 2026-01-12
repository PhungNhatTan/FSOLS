import progressModels from '../../models/progress/index.js';
import prisma from '../../prismaClient.js';

export default async function markLessonComplete(req, res) {
    try {
        const { lessonId } = req.params;
        const { enrollmentId } = req.body;
        
        // FIX: Use req.user.userId instead of req.user.id
        const accountId = req.user.userId;
        
        console.log('Mark lesson complete request:', { accountId, enrollmentId, lessonId });
        
        if (!accountId) {
            return res.status(401).json({
                error: 'Authentication error',
                message: 'User ID not found in token'
            });
        }
        
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
        
        const enrollment = await prisma.courseEnroll.findUnique({
            where: { Id: parseInt(enrollmentId) }
        });
        
        if (enrollment && enrollment.CourseId) {
            await progressModels.completeCourse(accountId, enrollment.CourseId);
        }
        
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