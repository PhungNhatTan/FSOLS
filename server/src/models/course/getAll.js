import prisma from "../../prismaClient.js"

const getAll = async () => {
  return prisma.course.findMany({
    where: {
      IsVerified: true,
      DeletedAt: null,
    },
    include: {
      Category: true,
      CreatedBy: {
        select: {
          AccountId: true,
          Name: true,
        },
      },
    },
    orderBy: {
      CreatedAt: "desc",
    },
  })
}

export default getAll
