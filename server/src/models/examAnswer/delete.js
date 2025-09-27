import prisma from "../../prismaClient.js";

export default async function remove(id) {
  return prisma.examAnswer.update({
    where: { Id: id },
    data: { DeletedAt: new Date() },
  });
}
