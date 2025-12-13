import prisma from "../../prismaClient.js"

/**
 * Get enrollment status for a user and course
 */
const getEnrollmentStatus = async (accountId, courseId) => {
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  return enrollment
}

export default getEnrollmentStatus
