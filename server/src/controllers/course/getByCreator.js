import courseModel from '../../models/course/index.js';

const getByCreator = async (req, res, next) => {
  try {
    const course = await courseModel.getByCreator();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export default getByCreator;
