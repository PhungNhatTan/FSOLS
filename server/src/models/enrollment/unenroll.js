import prisma from "../../prismaClient.js"

/**
 * Unenroll a user from a course (soft delete)
 */
const unenroll = async (accountId, courseId) => {
  const enrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  if (!enrollment) {
    throw new Error("Not enrolled in this course")
  }

  return prisma.courseEnroll.update({
    where: {
      Id: enrollment.Id,
    },
    data: {
      DeletedAt: new Date(),
    },
  })
}

export default unenroll
