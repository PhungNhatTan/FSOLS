import prisma from '../../prismaClient.js';

export default async function getSpecializationCourseNav(specId) {
    return prisma.specializationCourse.findMany({
        where: {
            SpecializationId: specId,
        },
        select: {
            CourseId: true,
            OrderNo: true,
        },
    })
}
