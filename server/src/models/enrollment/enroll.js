import prisma from "../../prismaClient.js"

/**
 * Enroll a user into a course
 */
const enroll = async (accountId, courseId) => {
  // Check if already enrolled
  const existingEnrollment = await prisma.courseEnroll.findFirst({
    where: {
      AccountId: accountId,
      CourseId: courseId,
      DeletedAt: null,
    },
  })

  if (existingEnrollment) {
    throw new Error("Already enrolled in this course")
  }

  // Create enrollment
  return prisma.courseEnroll.create({
    data: {
      AccountId: accountId,
      CourseId: courseId,
      Status: "Enrolled",
    },
    include: {
      Course: {
        select: {
          Id: true,
          Name: true,
        },
      },
    },
  })
}

export default enroll
