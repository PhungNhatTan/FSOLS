import courseModel from '../../models/course/index.js';

const createCourse = async (req, res, next) => {
  try {
    const court = await courseModel.create(req.body);
    res.status(201).json(court);
  } catch (err) {
    next(err);
  }
};

export default createCourse;
