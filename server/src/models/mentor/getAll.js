import prisma from '../../prismaClient.js';

export default async function getAll() {
  const mentors = await prisma.mentor.findMany({
    where: {
      DeletedAt: null,
    },
    select: {
      AccountId: true,
      Account: {
        select: {
          DisplayName: true,
          AvatarUrl: true,
        },
      },
      _count: {
        select: {
          courses: true,
        },
      },
    },
    orderBy: {
      CreatedAt: 'desc',
    },
  });

  const enrichedMentors = await Promise.all(
    mentors.map(async (mentor) => {
      const studentCount = await prisma.courseEnroll.count({
        where: {
          Course: {
            CreatedById: mentor.AccountId,
          },
        },
      });

      return {
        id: mentor.AccountId,
        name: mentor.Account.DisplayName,
        avatar: mentor.Account.AvatarUrl || 'https://i.pravatar.cc/150?img=0',
        headline: mentor.Account.AvatarUrl ? 'Verified Mentor' : 'Mentor',
        students: studentCount,
        courses: mentor._count.courses,
      };
    })
  );

  return enrichedMentors;
}
