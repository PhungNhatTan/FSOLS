import prisma from "../../prismaClient.js";

export default async function get(id) {
    return prisma.certificate.findFirst({
        where: {
            Id: id,
        },
        select: {
            Id: true,
            CertificateType: true,
            CourseId: true,
            Course: {
                Name: true,
            },
            SpecializationId: true,
            Specialization: {
                SpecializationCode: true,
                SpecializationName: true,
            }
        },
    })
}
