import prisma from '../../prismaClient.js';

export default async function get(id) {
    const lesson = await prisma.courseLesson.findUnique({
        where: { Id: id },
        select: {
            Id: true,
            Title: true,
            LessonType: true,
            VideoUrl: true,
            DocUrl: true,
        },
    });

    return {
        ...lesson,
        ContentUrl: lesson.LessonType === 'Video' ? lesson.VideoUrl : lesson.DocUrl
    }
}