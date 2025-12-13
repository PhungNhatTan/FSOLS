import courseModel from '../../models/course/index.js';

const requestVerification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await courseModel.createVerificationRequest(Number(id));
    res.json({ message: "Verification request submitted successfully", data: result });
  } catch (err) {
    if (err.message === 'Course not found') {
      return res.status(404).json({ message: "Course not found" });
    }
    next(err);
  }
};

export default requestVerification;
