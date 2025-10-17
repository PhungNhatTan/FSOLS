import certificateModel from '../../models/certificate/index.js';

const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await certificateModel.get(Number(id));
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (err) {
    next(err);
  }
};

export default get;
