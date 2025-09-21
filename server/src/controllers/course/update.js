import courseModel from '../../models/course/index.js';

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const court = await courseModel.update(Number(id), req.body);
    res.json(court);
  } catch (err) {
    next(err);
  }
};

export default updateCourse;
