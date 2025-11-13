import courseModel from '../../models/course/index.js';

const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = new Date();
    const course = await courseModel.delete(Number(id), date);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export default deleteCourse;
