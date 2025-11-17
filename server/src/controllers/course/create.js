import courseModel from '../../models/course/index.js';

const createCourse = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    const createdById = req.user?.userId; // from JWT
    if (!createdById) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const course = await courseModel.create({ name, description, createdById });
    res.status(201).json(course);
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: err.message }); // show the actual error
    next(err);
  }
};

export default createCourse;
