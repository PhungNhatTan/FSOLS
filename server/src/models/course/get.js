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
              OrderNo: true,
              CourseLesson: { select: { Id: true, Title: true } },
              Exam: { select: { Id: true, Title: true } },
            },
          },
        },
      },
    },
  });

  return course;
}
