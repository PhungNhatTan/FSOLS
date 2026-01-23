import prisma from "../../prismaClient.js";

export default async function getCourseWithCertificate(courseId, accountId) {
  try {
    // IMPORTANT:
    // This endpoint is used by the public Course detail page.
    // It MUST include the ordered module -> item -> lesson/exam structure,
    // otherwise the Review course timeline section will be empty.
    const course = await prisma.course.findFirst({
      where: { Id: courseId, DeletedAt: null },
      include: {
        Certificate: true,
        CourseModule: {
          where: { DeletedAt: null },
          orderBy: { OrderNo: "asc" },
          include: {
            ModuleItems: {
              where: { DeletedAt: null },
              orderBy: { OrderNo: "asc" },
              include: {
                CourseLesson: {
                  where: { DeletedAt: null },
                  orderBy: { CreatedAt: "asc" },
                  include: {
                    lessonResources: {
                      where: { DeletedAt: null },
                      orderBy: { OrderNo: "asc" },
                    },
                  },
                },
                Exam: {
                  where: { DeletedAt: null },
                  orderBy: { CreatedAt: "asc" },
                },
              },
            },
          },
        },
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
        DeletedAt: null,
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