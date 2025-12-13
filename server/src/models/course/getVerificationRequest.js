import prisma from '../../prismaClient.js';

export default async function getVerificationRequest(courseId) {
    return await prisma.verificationRequest.findFirst({
        where: { CourseId: courseId },
        orderBy: { CreatedAt: 'desc' },
        select: {
            Id: true,
            ApprovalStatus: true,
            RequestType: true,
            CreatedAt: true,
            ReviewedAt: true,
        }
    });
}
