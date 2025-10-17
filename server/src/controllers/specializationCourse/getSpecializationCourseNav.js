import specializationCourseModel from '../../models/specializationCourse/index.js';

const getNav = async (req, res, next) => {
  try {
    const { id } = req.params;
    const specializationCourse = await specializationCourseModel.get(Number(id));
    if (!specializationCourse) {
      return res.status(404).json({ message: 'SpecializationCourse not found' });
    }
    res.json(specializationCourse);
  } catch (err) {
    next(err);
  }
};

export default getNav;
