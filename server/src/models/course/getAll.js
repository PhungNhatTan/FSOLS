import prisma from '../../prismaClient.js';

const getCourse = async (id) => {
  return prisma.course.findMany({
    where: {
      Account: {
        some: { Id: id }
      },
    },
  });
}

export default getCourse;