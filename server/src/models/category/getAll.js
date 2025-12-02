import prisma from '../../prismaClient.js';

export default async function getAll() {
  const categories = await prisma.category.findMany({
    where: {
      DeletedAt: null,
    },
    select: {
      Id: true,
      Name: true,
      Slug: true,
      Description: true,
      _count: {
        select: {
          courses: true,
        },
      },
    },
    orderBy: {
      Name: 'asc',
    },
  });

  return categories.map((cat) => ({
    id: cat.Id,
    name: cat.Name,
    slug: cat.Slug,
    description: cat.Description,
    courseCount: cat._count.courses,
  }));
}
