import prisma from '../../prismaClient.js';

export default async function verifyCourse(id) {
    const courseId = parseInt(id);
    
    // Update course
    const course = await prisma.course.update({
        where: { Id: courseId },
        data: { 
            PublishedAt: new Date(),
        },
    });
    
    // Update verification request
    await prisma.verificationRequest.updateMany({
        where: { 
            CourseId: courseId,
            ApprovalStatus: 'Pending'
        },
        data: {
            ApprovalStatus: 'Approved',
            ReviewedAt: new Date(),
        }
    });
    
    return course;
}
