import prisma from "../../prismaClient.js";

export default async function getByCourseId(courseId) {
    if (courseId == null) return null;

    return prisma.certificate.findFirst({
        where: {
            CourseId: Number(courseId),
            DeletedAt: null,
        },
        select: {
            Id: true,
            CertificateType: true,
            CourseId: true,
            CreatedAt: true,
            Course: {
                select: {
                    Id: true,
                    Name: true,
                },
            },
        },
    });
}
