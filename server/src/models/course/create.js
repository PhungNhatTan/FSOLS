import prisma from "../../prismaClient.js";

export default async function create({ name, description }) {
  return prisma.course.create({
    data: {
      Name: name,
      Description: description,
    },
    select: {
      Id: true,
      Name: true,
      Description: true,
    },
  });
}