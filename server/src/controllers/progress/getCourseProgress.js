import progressModels from '../../models/progress/index.js';

export default async function getCourseProgress(req, res){
  try {
    const { courseId } = req.params;
    const accountId = req.user.id;

    const progress = await progressModels.getCourseProgress(
      accountId,
      parseInt(courseId, 10)
    );

    res.json(progress);
  } catch (error) {
    console.error('[Progress] Get course progress error:', error);
    res.status(500).json({ 
      error: 'Failed to get progress',
      message: error.message 
    });
  }
}