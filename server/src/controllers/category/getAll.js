import categoryModel from '../../models/category/index.js';

const getAll = async (req, res, next) => {
  try {
    const categories = await categoryModel.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export default getAll;
