import courseModel from '../../models/course/index.js';

const saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { modules } = req.body;

    if (!modules) {
      return res.status(400).json({ message: "modules is required" });
    }

    const result = await courseModel.saveDraft(Number(id), modules);
    res.json({ message: "Draft saved successfully", data: result });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Course not found" });
    }
    next(err);
  }
};

export default saveDraft;
