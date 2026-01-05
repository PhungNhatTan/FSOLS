import progressModels from '../../models/progress/index.js';

export default async function checkExamCompletion (req, res) {
  try {
    const { examId } = req.params;
    const accountId = req.user.id;

    const isCompleted = await progressModels.checkExamCompletion(
      accountId,
      parseInt(examId, 10)
    );

    res.json({ 
      completed: isCompleted,
      examId: parseInt(examId, 10)
    });
  } catch (error) {
    console.error('[Progress] Check exam completion error:', error);
    res.status(500).json({ 
      error: 'Failed to check exam completion',
      message: error.message 
    });
  }
}