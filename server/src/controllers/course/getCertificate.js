import certificateModel from "../../models/certificate/index.js";

export default async function getCourseCertificate(req, res, next) {
  try {
    const { id } = req.params;
    const certificate = await certificateModel.getByCourseId(Number(id));
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    res.json(certificate);
  } catch (error) {
    next(error);
  }
}
