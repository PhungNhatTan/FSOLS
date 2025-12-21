import prisma from '../../prismaClient.js';

const getVerificationDraft = async (courseId) => {
    return prisma.verificationRequest.findFirst({
        where: { CourseId: parseInt(courseId) },
        orderBy: { CreatedAt: 'desc' },
        select: { DraftSnapshot: true }
    });
}

export default getVerificationDraft;
