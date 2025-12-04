import prisma from "../../prismaClient.js";

export default async function remove(id) {
  try {
    const existing = await prisma.courseModule.findFirst({
      where: { Id: id, DeletedAt: null },
    });
    
    if (!existing) {
      return null;
    }

    return await prisma.courseModule.update({
      where: { Id: id },
      data: { DeletedAt: new Date() },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return null;
    }
    throw err;
  }
}
