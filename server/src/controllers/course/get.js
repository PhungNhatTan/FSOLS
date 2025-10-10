import courseModel from '../../models/course/index.js';

const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseModel.get(Number(id));
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export default get;
