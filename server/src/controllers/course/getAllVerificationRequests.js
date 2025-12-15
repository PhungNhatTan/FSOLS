import courseModel from '../../models/course/index.js';

const getAllVerificationRequests = async (req, res, next) => {
  try {
    const requests = await courseModel.getAllVerificationRequests();
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export default getAllVerificationRequests;
