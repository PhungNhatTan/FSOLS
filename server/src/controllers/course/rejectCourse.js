import courseModel from '../../models/course/index.js';

export default async function rejectCourse(req, res, next) {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
    }

    try {
        await courseModel.rejectCourse(id, reason);
        res.status(200).json({ message: 'Course rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject course' });
        next(error);
    }
}
