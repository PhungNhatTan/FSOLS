import userCertificateModel from '../../models/userCertificate/index.js';

const get = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userCertificate = await userCertificateModel.get(id);
        if (!userCertificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        res.json(userCertificate);
    } catch (err) {
        next(err);
    }
};

export default get;
