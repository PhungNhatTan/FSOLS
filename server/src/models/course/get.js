import prisma from '../../prismaClient.js';

export default async function get(id) {
  return prisma.course.findUnique({
    where: { Id: parseInt(id) },
    select: {
      Id: true,
      Name: true,
      Description: true,
      CourseModule: {
        select: {
          Id: true,
          OrderNo: true,
          ModuleItems: {
            select: {
              Id: true,
              OrderNo: true,
              CourseLesson: {
                select: { Id: true, Title: true, LessonType: true },
              },
              Exam: {
                select: { Id: true, Title: true },
              },
            },
            orderBy: { OrderNo: 'asc' }
          },
        },
        orderBy: { OrderNo: 'asc' }
      },
      Exam: {
        select: { Id: true, Title: true },
      },
    },
  });
}