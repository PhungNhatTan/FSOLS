import progressModels from '../../models/progress/index.js'

export default async function getCourseProgress(req, res) {
  try {
    const { courseId } = req.params;
    const accountId = req.user.userId;

    const progress = await progressModels.getCourseProgress(
      accountId,
      parseInt(courseId, 10)
    );

    res.json(progress);
  } catch (error) {
    const status = error && typeof error === 'object' && error.statusCode ? error.statusCode : 500
    const meta = error && typeof error === 'object' && error.meta ? error.meta : null
    console.error('[Progress] Get course progress error:', error)
    res.status(status).json({
      error: 'Failed to get progress',
      message: error?.message || 'Failed to get progress',
      code: error?.code,
      ...(meta && typeof meta === 'object' ? meta : {}),
    })
  }
}