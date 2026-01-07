import prisma from "../../prismaClient.js";
import { calculateSimilarity } from '../../services/aiService.js';

export default getRecommendations = async (req, res) => {
  const userId = req.user.Id;

  // 1. Get User Interest Profile (Avg of enrolled course vectors)
  const enrollments = await prisma.courseEnroll.findMany({
    where: { StudentId: userId },
    include: { Course: { include: { Embedding: true } } }
  });

  if (enrollments.length === 0) return res.json([]); // Or return featured

  const userVector = enrollments[0].Course.Embedding.Vector; // Simplified: take latest

  // 2. Get all available courses with embeddings
  const candidates = await prisma.course.findMany({
    where: { 
      NOT: { CourseEnroll: { some: { StudentId: userId } } },
      Embedding: { isNot: null }
    },
    include: { Embedding: true, Category: true }
  });

  // 3. Rank
  const ranked = candidates.map(course => ({
    ...course,
    score: calculateSimilarity(userVector, course.Embedding.Vector)
  })).sort((a, b) => b.score - a.score).slice(0, 4);

  res.json(ranked);
};
