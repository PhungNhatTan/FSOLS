import prisma from '../../prismaClient.js';

const getCourse = async (id) => {
  return prisma.course.findUnique({
    where: { id },
    select: {
      
    }
  });
}

export default getCourse;