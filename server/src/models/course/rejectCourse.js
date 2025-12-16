import prisma from '../../prismaClient.js';

export default async function rejectCourse(id, reason) {
    const courseId = parseInt(id);
    
    // Update verification request
    await prisma.verificationRequest.updateMany({
        where: { 
            CourseId: courseId,
            ApprovalStatus: 'Pending'
        },
        data: {
            ApprovalStatus: 'Rejected',
            Reason: reason,
            ReviewedAt: new Date(),
        }
    });
    
    return { success: true };
}
