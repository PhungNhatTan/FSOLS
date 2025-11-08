import prisma from "../../prismaClient.js";

export default async function create({ certificateType, courseId, specializationId }) {
    const data = {
        CertificateType: certificateType,
        ...(courseId && { Course: { connect: { Id: courseId } } }),
        ...(specializationId && { Specialization: { connect: { Id: specializationId } } }),
    };

    return prisma.certificate.create({ data });
}
