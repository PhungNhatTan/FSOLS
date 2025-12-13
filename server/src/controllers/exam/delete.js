import examModel from '../../models/exam/index.js';

const deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedExam = await examModel.remove(Number(id));
        if (!deletedExam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        next(err);
    }
}

export default deleteExam;
