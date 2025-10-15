import prisma from '../../prismaClient.js';

export default async function getListNav(id) {
    return prisma.course.findUnique({
        where: { Id: Number(id) },
        select: {
            CourseModule: {
                select: {
                    Id: true,
                    OrderNo: true,
                    ModuleItems: {
                        select: {
                            Id: true,
                            OrderNo: true,
                            CourseLesson: {
                                select: { Id: true, Title: true },
                            },
                            Exam: {
                                select: { Id: true, Title: true },
                            },
                        }
                    }
                },
                orderBy: { OrderNo: 'asc' }
            }
        }
    });
}