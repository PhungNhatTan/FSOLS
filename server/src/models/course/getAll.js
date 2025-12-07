import prisma from '../../prismaClient.js';

const getAll = async () => {
  return prisma.course.findMany({
    where: {
      DeletedAt: null,
      IsVerified: true,
    },
  });
};

export default getAll;
