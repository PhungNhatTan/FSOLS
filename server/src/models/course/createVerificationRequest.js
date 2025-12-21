import prisma from '../../prismaClient.js';

export default async function createVerificationRequest(courseId) {
    const course = await prisma.course.findUnique({
        where: { Id: courseId },
    });

    if (!course) {
        throw new Error('Course not found');
    }

    const requestType = course.PublishedAt ? 'Update' : 'New';

    return await prisma.verificationRequest.create({
        data: {
            CourseId: courseId,
            RequestType: requestType,
            ApprovalStatus: 'Pending',
            DraftSnapshot: course.Draft,
        }
    });
}
