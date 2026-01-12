import prisma from "../../prismaClient.js";

export default async function getCourseWithCertificate(courseId, accountId) {
  try {
    const course = await prisma.course.findUnique({
      where: { Id: courseId },
      include: {
        Certificate: true,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const certificate = await prisma.userCertificate.findFirst({
      where: {
        Certificate: {
          CourseId: courseId,
        },
        AccountId: accountId,
      },
      include: {
        Certificate: true,
      },
    });

    return {
      ...course,
      Certificate: certificate || null,
    };
  } catch (error) {
    console.error("Error fetching course with certificate:", error);
    throw error;
  }
}