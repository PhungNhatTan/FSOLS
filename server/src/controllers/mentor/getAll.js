import mentorModel from '../../models/mentor/index.js';

const getAll = async (req, res, next) => {
  try {
    const mentors = await mentorModel.getAll();
    res.json(mentors);
  } catch (err) {
    next(err);
  }
};

export default getAll;
