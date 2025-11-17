import lessonModel from '../../models/lesson/index.js';

const deleteLesson = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedLesson = await lessonModel.remove(id);
        if (!deletedLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        next(err);
    }
}

export default deleteLesson;