import prisma from '../../prismaClient.js';

export default async function getFeatured() {
  const courses = await prisma.course.findMany({
    where: {
      IsVerified: true,
      PublishedAt: { not: null },
    },
    include: {
      CreatedBy: {
        select: {
          AccountId: true,
          Name: true,
          Email: true,
        },
      },
      Category: true,
      CourseModule: {
        select: {
          Id: true,
          ModuleItems: {
            select: {
              CourseLesson: { select: { Id: true } },
            },
          },
        },
      },
      courseReviews: {
        select: {
          Rating: true,
        },
      },
      CourseEnroll: {
        select: {
          Id: true,
        },
      },
    },
    orderBy: {
      CreatedAt: 'desc',
    },
    take: 4,
  });

  return courses.map((course) => {
    const lessonCount = course.CourseModule.reduce((total, module) => {
      return total + (module.ModuleItems?.filter((item) => item.CourseLesson).length || 0);
    }, 0);

    const ratings = course.courseReviews || [];
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.Rating, 0) / ratings.length : 0;

    return {
      id: course.Id,
      title: course.Name,
      slug: `course-${course.Id}`,
      thumbnail: `https://images.unsplash.com/photo-${1515879218367 + course.Id}?w=1200&q=80&auto=format&fit=crop`,
      mentor: course.CreatedBy?.Name || 'Unknown',
      mentorId: course.CreatedBy?.AccountId ? parseInt(course.CreatedBy.AccountId) : 0,
      rating: parseFloat(avgRating.toFixed(1)),
      ratingCount: ratings.length,
      durationHours: 0,
      lessons: lessonCount,
      categoryId: course.CategoryId || 0,
    };
  });
}
