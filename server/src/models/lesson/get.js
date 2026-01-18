import prisma from '../../prismaClient.js';

export default async function get(id) {
    const lesson = await prisma.courseLesson.findUnique({
        where: { Id: id },
        select: {
            Id: true,
            Title: true,
            // IMPORTANT:
            // LessonType / VideoUrl / DocUrl are legacy fields and must not be used.
            // All file links are served via LessonResource.
            lessonResources: {
                select: {
                    Id: true,
                    Name: true,
                    Url: true,
                    OrderNo: true,
                },
                orderBy: {
                    OrderNo: 'asc',
                },
            },
        },
    });
    
    if (!lesson) return null;

    const resources = lesson.lessonResources ?? [];
    const primary = resources[0] ?? null;

    return {
        Id: lesson.Id,
        Title: lesson.Title,
        // Standardized casing for the client
        LessonResources: resources.map((r) => ({
            Id: r.Id,
            Name: r.Name,
            Url: r.Url,
            OrderNo: r.OrderNo,
        })),
        Resource: primary
            ? { Id: primary.Id, Name: primary.Name, Url: primary.Url, OrderNo: primary.OrderNo }
            : null,
    };
}