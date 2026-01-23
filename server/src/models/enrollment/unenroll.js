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

  // Business rule: once a course is completed, disallow manual unenrollment.
  // Keeping the enrollment record preserves completion/certification history.
  if (enrollment.Status === "Completed" || enrollment.CompletedAt) {
    throw new Error("Cannot unenroll from a completed course")
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
