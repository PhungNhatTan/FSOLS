import prisma from "../../prismaClient.js";

export default async function create({ name, description, createdById }) {
  return prisma.course.create({
    data: {
      Name: name,
      Description: description,
      CreatedById: createdById,
    },
    select: {
      Id: true,
      Name: true,
      Description: true,
    },
  });
}
