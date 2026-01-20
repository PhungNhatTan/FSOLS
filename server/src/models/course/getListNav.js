import prisma from '../../prismaClient.js';

export default async function getListNav(id) {
  return prisma.course.findUnique({
    where: { Id: id },
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
              EstimatedDuration: true,
              CourseLesson: {
                select: {
                  Id: true,
                  Title: true,
                  LessonType: true,
                },
              },
              Exam: {
                select: {
                  Id: true,
                  Title: true,
                },
              },
            },
            orderBy: { OrderNo: 'asc' },
          },
        },
        orderBy: { OrderNo: 'asc' },
      },
    },
  });
}
