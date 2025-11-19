import prisma from "../../prismaClient.js";

export default async function remove(id) {
  return prisma.exam.update({
    where: { Id: id, DeletedAt: null },
    data: { DeletedAt: new Date() },
  });
}
