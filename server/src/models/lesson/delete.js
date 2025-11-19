import prisma from '../../prismaClient.js';

export default async function deleteLesson(id) {
    return prisma.courseLesson.update({
        where: { Id: id, DeletedAt: null },
        data: { DeletedAt: new Date() },
    });
}
