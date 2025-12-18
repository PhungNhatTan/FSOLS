import prisma from '../../prismaClient.js';
import commitDraft from './commitDraft.js';
import { moveDraftToProduction } from '../../services/courseResource.js';

export default async function verifyCourse(id) {
    const courseId = parseInt(id);
    
    // Get course to check for draft
    const courseData = await prisma.course.findUnique({
        where: { Id: courseId },
        select: { Draft: true }
    });

    if (courseData && courseData.Draft) {
        // 1. Move resources from draft to production
        const movedFiles = moveDraftToProduction(courseId);
        
        // 2. Update URLs in the draft object
        let draftString = JSON.stringify(courseData.Draft);
        
        for (const file of movedFiles) {
            // Replace all occurrences of the draft URL with the production URL
            // We use a global regex replacement
            const regex = new RegExp(file.draftUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            draftString = draftString.replace(regex, file.productionUrl);
        }
        
        const updatedDraft = JSON.parse(draftString);

        // 3. Commit the draft with updated URLs
        const result = await commitDraft(courseId, updatedDraft);
        if (!result.success) {
            throw new Error("Failed to commit draft: " + result.errors.join(", "));
        }
    } else {
        // If no draft, just update PublishedAt (fallback behavior)
        await prisma.course.update({
            where: { Id: courseId },
            data: { 
                PublishedAt: new Date(),
            },
        });
    }
    
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
    
    return { success: true };
}
