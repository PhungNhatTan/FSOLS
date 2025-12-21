import courseModel from '../../models/course/index.js';

const getVerificationDraft = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const result = await courseModel.getVerificationDraft(id);

    if (!result) {
      return res.status(404).json({ message: 'Verification draft not found' });
    }

    return res.json({ draft: result.DraftSnapshot });
  } catch (err) {
    next(err);
  }
};

export default getVerificationDraft;
