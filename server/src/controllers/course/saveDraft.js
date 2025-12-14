import courseModel from '../../models/course/index.js';

const saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { draft } = req.body;

    if (!draft) {
      return res.status(400).json({ message: "draft is required" });
    }

    const parsedDraft =
      typeof draft === "string" ? JSON.parse(draft) : draft;

    if (!Array.isArray(parsedDraft.modules)) {
      return res.status(400).json({ message: "draft.modules is required" });
    }

    const result = await courseModel.saveDraft(
      Number(id),
      parsedDraft
    );

    res.json({
      message: "Draft saved successfully",
      draft: parsedDraft,
      result,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Course not found" });
    }
    next(err);
  }
};

export default saveDraft;