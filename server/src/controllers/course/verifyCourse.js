import courseModel from '../../models/course/index.js';

export default async function verifyCourse(req, res, next) {
    const { id } = req.params;
    try {
        const course = await courseModel.verifyCourse(id);
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify course' });
        next(error);
    }
}