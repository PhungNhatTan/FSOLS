import prisma from '../../prismaClient.js';

export default async function create(data) {
    return prisma.courseLesson.create({
    data: {
      Title: data.Title,
      LessonType: data.LessonType,
      VideoUrl: data.VideoUrl,
      DocUrl: data.DocUrl,
      ModuleItem: {
        create: {
          OrderNo: data.OrderNo ?? 10,
          CourseModule: { connect: { Id: data.CourseModuleId } },
        },
      },
    },
    include: { ModuleItem: true },
  });
}
