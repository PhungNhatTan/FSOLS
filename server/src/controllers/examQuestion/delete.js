import examQuestionModel from '../../models/examQuestion/index.js';
export default async function deleteExamQuestion(req, res, next) {
    try {
        const { id } = req.params;
        const deletedExamQuestion = await examQuestionModel.remove(id);
        if (!deletedExamQuestion) {
            return res.status(404).json({ error: 'Exam Question not found' });
        }
        res.json(deletedExamQuestion);
    } catch (err) {
        next(err);
    };
};