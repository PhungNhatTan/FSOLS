import prisma from "../../prismaClient.js";

export default async function getCertificateController(req, res, next) {
    try {
        const { accountId, certificateId } = req.params;

        const cert = await prisma.userCertificate.findFirst({
            where: {
                AccountId: accountId,
                CertificateId: parseInt(certificateId, 10),
            },
            include: {
                Account: {
                    select: {
                        Id: true,
                        DisplayName: true,
                    },
                },
                Certificate: {
                    select: {
                        Id: true,
                        CertificateType: true,
                        CourseId: true,
                        Course: {
                            select: {
                                Name: true,
                            },
                        },
                        SpecializationId: true,
                        Specialization: {
                            select: {
                                SpecializationCode: true,
                                SpecializationName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!cert) {
            return res.status(404).json({ error: "Certificate not found" });
        }

        res.json(cert);
    } catch (err) {
        next(err);
    }
}
