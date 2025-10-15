import prisma from '../../prismaClient.js';

export default async function get(id) {
    return prisma.userCertificate.findUnique({
        where: {
            Id: id,
        },
        select: {
            CertificateId: true,
            Certificate: {
                select:{
                    CertificateType: true,
                    CourseId: true,
                    Course:{
                        Name: true,
                    },
                    SpecializationId: true,
                    Specialization:{
                        SpecializationName: true,
                    },
                }
            },
            AccountId: true,
            Account:{
                DisplayName: true,
            },
        }
    });
}
