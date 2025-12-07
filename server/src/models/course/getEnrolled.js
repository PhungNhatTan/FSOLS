import prisma from '../../prismaClient.js';

const getAll = async (accountId) => {
  return prisma.course.findMany({
    where: {
      CourseEnroll: {
        some: {
          AccountId: accountId,
        },
      },
    },
    include: {
      CourseEnroll: {
        include: {
          Account: true, 
        },
      },
    },
  });
};

export default getAll;
