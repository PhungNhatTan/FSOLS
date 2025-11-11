import courseModel from '../../models/course/index.js';

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseModel.update(Number(id), req.body);
    res.json(course);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Course not found" });
    }
    next(err);
  }
};

export default updateCourse;
