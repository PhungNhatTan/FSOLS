import prisma from '../../prismaClient.js';

const getByCreator = async (accountId) => {
    return prisma.course.findMany({
        where: {
            CreatedById: accountId,
            DeletedAt: null,
        }
    });
}

export default getByCreator;