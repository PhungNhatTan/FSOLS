import prisma from '../../prismaClient.js';

const getAll = async (id) => {
  return prisma.course.findMany({
    where: {
      Account: {
        some: { Id: id }
      },
    },
  });
}

export default getAll;