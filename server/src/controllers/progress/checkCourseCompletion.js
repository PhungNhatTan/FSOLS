
import progressModels from '../../models/progress/index.js';
export default async function checkCourseCompletion (req, res) {
  try {
    const { courseId } = req.params;
    const accountId = req.user.id;

    const isCompleted = await progressModels.checkCourseCompletion(
      accountId,
      parseInt(courseId, 10)
    );

    res.json({ 
      completed: isCompleted,
      courseId: parseInt(courseId, 10)
    });
  } catch (error) {
    console.error('[Progress] Check course completion error:', error);
    res.status(500).json({ 
      error: 'Failed to check completion',
      message: error.message 
    });
  }
}