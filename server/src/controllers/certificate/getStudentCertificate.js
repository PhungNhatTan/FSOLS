import certificateModel from "../../models/certificate/index.js";

export default async function getCertificateController(req, res, next) {
    try {
        const { accountId, certificateId } = req.params;

        const cert = await certificateModel.get({
            accountId,
            certificateId: parseInt(certificateId, 10),
        });

        if (!cert) {
            return res.status(404).json({ error: "Certificate not found" });
        }

        res.json(cert);
    } catch (err) {
        next(err);
    }
}
