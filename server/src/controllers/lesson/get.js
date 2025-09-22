import lessonModel from '../../models/lesson/index.js';

const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await lessonModel.get(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(lesson);
  } catch (err) {
    next(err);
  }
};

export default getCourse;
