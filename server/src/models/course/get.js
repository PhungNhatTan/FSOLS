import prisma from '../../prismaClient.js';

export default async function get(id) {
  const course = await prisma.course.findUnique({
    where: { Id: Number(id), DeletedAt: null },
    select: {
      Id: true,
      Name: true,
      Description: true,
      CourseModule: {
        where: { DeletedAt: null },
        select: {
          Id: true,
          OrderNo: true,
          ModuleItems: {
            where: { DeletedAt: null },
            select: {
              Id: true,
              OrderNo: true,
              EstimatedDuration: true,
              CourseLesson: {
                select: {
                  Id: true,
                  Title: true,
                  lessonResources: {
                    where: { DeletedAt: null },
                    select: { Id: true, Name: true, Url: true },
                  },
                },
              },
              Exam: {
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
