import courseModel from '../../models/course/index.js';

const getFeatured = async (req, res, next) => {
  try {
    const courses = await courseModel.getFeatured();
    if (!courses) {
      return res.status(404).json({ message: 'No featured courses found' });
    }
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

export default getFeatured;
