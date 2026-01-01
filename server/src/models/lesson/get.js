import prisma from '../../prismaClient.js';

export default async function get(id) {
    const lesson = await prisma.courseLesson.findUnique({
        where: { Id: id },
        select: {
            Id: true,
            Title: true,
            LessonType: true,
            VideoUrl: true,  // Keep for backward compatibility
            DocUrl: true,    // Keep for backward compatibility
            lessonResources: {  // Note: lowercase 'l' and plural
                select: {
                    Id: true,
                    Name: true,      // Changed from ResourceName
                    Url: true,       // Changed from ResourceUrl
                    OrderNo: true,
                },
                orderBy: {
                    OrderNo: 'asc',  // Order by OrderNo to get primary resource first
                },
            },
        },
    });
    
    if (!lesson) return null;
    
    // Get the first resource (assuming one resource per lesson or ordered by OrderNo)
    const primaryResource = lesson.lessonResources?.[0];
    
    // Primary: Use lessonResources if available
    // Fallback: Use deprecated VideoUrl/DocUrl for old data
    const resourceUrl = primaryResource?.Url || 
                       (lesson.LessonType === 'Video' ? lesson.VideoUrl : lesson.DocUrl);
    
    return {
        Id: lesson.Id,
        Title: lesson.Title,
        LessonType: lesson.LessonType,
        ContentUrl: resourceUrl,
        // Include resource details if available
        Resource: primaryResource ? {
            Id: primaryResource.Id,
            Name: primaryResource.Name,
            Url: primaryResource.Url,
        } : null,
        // Keep deprecated fields for backward compatibility during migration
        VideoUrl: lesson.VideoUrl,
        DocUrl: lesson.DocUrl,
    };
}