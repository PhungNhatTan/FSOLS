import prisma from '../../prismaClient.js';

const getDraft = async (courseId) => {
    return prisma.course.findUnique({
        where: { Id: parseInt(courseId) },
        select: { Draft: true }
    });
}

export default getDraft;