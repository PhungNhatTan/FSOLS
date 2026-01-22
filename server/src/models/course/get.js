import prisma from '../../prismaClient.js';

export default async function get(id) {
  const course = await prisma.course.findUnique({
    where: { Id: Number(id), DeletedAt: null },
    select: {
      Id: true,
      Name: true,
      Description: true,
      PublishedAt: true,
      CourseModule: {
        where: { DeletedAt: null },
        orderBy: { OrderNo: 'asc' },
        select: {
          Id: true,
          Title: true,
          OrderNo: true,
          ModuleItems: {
            where: { DeletedAt: null },
            orderBy: { OrderNo: 'asc' },
            select: {
              Id: true,
              OrderNo: true,
              EstimatedDuration: true,
              CourseLesson: {
                where: { DeletedAt: null },
                orderBy: { CreatedAt: 'asc' },
                select: {
                  Id: true,
                  Title: true,
                  lessonResources: {
                    where: { DeletedAt: null },
                    orderBy: { OrderNo: 'asc' },
                    select: { Id: true, Name: true, Url: true },
                  },
                },
              },
              Exam: {
                where: { DeletedAt: null },
                orderBy: { CreatedAt: 'asc' },
                select: {
                  Id: true,
                  Title: true,
                  DurationPreset: true,
                  DurationCustom: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return course;
}
