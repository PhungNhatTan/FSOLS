import prisma from "../../prismaClient.js";

const saveDraft = async (id, draftData) => {
  return prisma.course.update({
    where: { Id: id },
    data: {
      Draft: draftData,
    },
  });
};

export default saveDraft;
