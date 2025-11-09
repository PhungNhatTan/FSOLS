import courseModel from '../../models/course/index.js';

const createCourse = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    const course = await courseModel.create({ name, description });
    res.status(201).json(course);
  } catch (err) {
    console.error("Error creating course:", err);
    next(err);
    res.status(500).json({ error: "Failed to create course" });
  }
};

export default createCourse;
