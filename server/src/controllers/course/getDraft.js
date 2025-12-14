import courseModel from '../../models/course/index.js';

const getDraft = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const result = await courseModel.getDraft(id);

    if (!result) {
      return res.status(404).json({ message: 'Course draft not found' });
    }

    return res.json({ draft: result.Draft });
  } catch (err) {
    next(err);
  }
};

export default getDraft;
