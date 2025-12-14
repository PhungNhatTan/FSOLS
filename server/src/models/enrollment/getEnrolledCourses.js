import prisma from "../../prismaClient.js"

/**
 * Get all enrolled courses for a user
 */
const getEnrolledCourses = async (accountId) => {
  const enrollments = await prisma.courseEnroll.findMany({
    where: {
      AccountId: accountId,
      DeletedAt: null,
    },
    include: {
      Course: {
        include: {
          CreatedBy: {
            select: {
              Name: true,
            },
          },
          Category: true,
        },
      },
    },
    orderBy: {
      EnrolledAt: "desc",
    },
  })

  return enrollments
}

export default getEnrolledCourses
