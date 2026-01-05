import prisma from "../../prismaClient.js";

const updateCourse = async (id, data) => {
  return prisma.course.updateMany({
    where: { Id: id, DeletedAt: null },
    data,
  });
};

export default updateCourse;
