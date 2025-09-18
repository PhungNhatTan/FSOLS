import prisma from "../../prismaClient.js";

const updateCourse = async (id, data) => {
  return prisma.course.update({ where: { id }, data });
};

export default updateCourse;
