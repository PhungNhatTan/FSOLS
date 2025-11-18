import prisma from '../../prismaClient.js';

const getByCreator = async (accountId) => {
    return prisma.course.findMany({
        where: {
            CreatedById: accountId,
        }
    });
}

export default getByCreator;