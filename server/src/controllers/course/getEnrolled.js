import courseModel from '../../models/course/index.js';

const getAll = async (req, res, next) => {
    try {
        const accountId = req.accountId;
        const course = await courseModel.getEnrolled(accountId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        next(err);
    }
};

export default getAll;
