import prisma from '../../prismaClient.js';

export default async function verifyCourse(id) {
    return await prisma.course.update({
        where: { id },
        data: { IsVerified: true },
    });
}