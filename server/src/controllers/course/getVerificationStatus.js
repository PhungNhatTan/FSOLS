import courseModel from '../../models/course/index.js';

const getVerificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await courseModel.getVerificationRequest(Number(id));
    res.json(result || null);
  } catch (err) {
    next(err);
  }
};

export default getVerificationStatus;
