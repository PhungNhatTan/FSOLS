import prisma from "../../prismaClient.js";
import { calculateSimilarity } from "../../services/aiService.js";
import courseModel from "../../models/course/index.js";

const avgVectors = (vectors) => {
  const len = vectors[0].length;
  const sum = Array(len).fill(0);
  for (const v of vectors) for (let i = 0; i < len; i++) sum[i] += Number(v[i]) || 0;
  return sum.map((x) => x / vectors.length);
};

export default async function getRecommendations(req, res) {
  const userId = req.user?.userId || req.user?.accountId;

  // Không đăng nhập: trả về featured (đỡ lỗi + UX hợp lý)
  if (!userId) {
    const featured = await courseModel.getFeatured();
    return res.json(featured);
  }

  // Lấy embedding từ các course đã enroll
  const enrollments = await prisma.courseEnroll.findMany({
    where: { AccountId: userId },
    include: { Course: { include: { Embedding: true } } },
  });

  const vectors = enrollments
    .map((e) => e.Course?.Embedding?.Vector)
    .filter((v) => Array.isArray(v) && v.length);

  if (!vectors.length) {
    const featured = await courseModel.getFeatured();
    return res.json(featured);
  }

  const userVector = avgVectors(vectors);

  // Candidate courses (đã publish + có embedding + chưa enroll)
  const candidates = await prisma.course.findMany({
    where: {
      DeletedAt: null,
      PublishedAt: { not: null },
      Embedding: { isNot: null },
      CourseEnroll: { none: { AccountId: userId } },
    },
    include: {
      Embedding: true,
      Category: true,
      CreatedBy: { select: { AccountId: true, Name: true } },
      CourseModule: {
        select: { Id: true, ModuleItems: { select: { CourseLesson: { select: { Id: true } } } } },
      },
      courseReviews: { select: { Rating: true } },
      CourseEnroll: { select: { Id: true } },
    },
  });

  const ranked = candidates
    .map((course) => ({
      course,
      score: calculateSimilarity(userVector, course.Embedding?.Vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ course, score }) => {
      const lessonCount = course.CourseModule.reduce((total, m) => {
        return total + (m.ModuleItems?.filter((it) => it.CourseLesson).length || 0);
      }, 0);

      const ratings = course.courseReviews || [];
      const avgRating = ratings.length ? ratings.reduce((s, r) => s + r.Rating, 0) / ratings.length : 0;

      return {
        id: course.Id,
        title: course.Name,
        slug: `course-${course.Id}`,
        thumbnail: `https://images.unsplash.com/photo-${1515879218367 + course.Id}?w=1200&q=80&auto=format&fit=crop`,
        mentor: course.CreatedBy?.Name || "Unknown",
        mentorId: course.CreatedBy?.AccountId ? parseInt(course.CreatedBy.AccountId) : 0,
        rating: Number(avgRating.toFixed(1)),
        ratingCount: ratings.length,
        durationHours: 0,
        lessons: lessonCount,
        categoryId: course.CategoryId || 0,
        score,
      };
    });

  return res.json(ranked);
}
