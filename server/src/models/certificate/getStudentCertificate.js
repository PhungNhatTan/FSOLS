import prisma from "../../prismaClient.js";

export default async function getCertificate({ accountId, certificateId }) {

    const certMeta = await prisma.userCertificate.findFirst({
        where: {
            AccountId: accountId,
            CertificateId: certificateId,
        },
        select: {
            Id: true,
            Account: { select: { Id: true, DisplayName: true } },
            Certificate: {
                select: {
                    Id: true,
                    CertificateType: true,
                },
            },
        },
    });

    if (!certMeta) {
        return null
    };

    if (certMeta.Certificate.CertificateType === "Course") {
        const fullCert = await prisma.userCertificate.findFirst({
            where: {
                AccountId: accountId,
                CertificateId: certificateId,
            },
            select: {
                Id: true,
                Account: { select: { Id: true, DisplayName: true } },
                Certificate: {
                    select: {
                        Id: true,
                        CertificateType: true,
                        Course: { select: { Id: true, Name: true } },
                    },
                },
            },
        });
        return fullCert;
    }

    if (certMeta.Certificate.CertificateType === "Specialization") {
        const fullCert = await prisma.userCertificate.findFirst({
            where: {
                AccountId: accountId,
                CertificateId: certificateId,
            },
            select: {
                Id: true,
                Account: { select: { Id: true, DisplayName: true } },
                Certificate: {
                    select: {
                        Id: true,
                        CertificateType: true,
                        Specialization: {
                            select: { Id: true, SpecializationName: true },
                        },
                    },
                },
            },
        });
        return fullCert;
    }

    return certMeta;
}
