// server/src/services/courseEmbeddingService.js
import prisma from "../prismaClient.js";
import { generateEmbedding } from "./aiService.js";

const compact = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const clampText = (text, maxChars = 12000) => {
  const t = compact(text);
  return t.length > maxChars ? t.slice(0, maxChars) : t;
};

export const buildCourseEmbeddingText = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { Id: Number(courseId) },
    include: {
      Category: true,
      courseSkills: { where: { DeletedAt: null } },
      CourseModule: {
        where: { DeletedAt: null },
        orderBy: { OrderNo: "asc" },
        include: {
          ModuleItems: {
            where: { DeletedAt: null },
            orderBy: { OrderNo: "asc" },
            include: {
              CourseLesson: {
                where: { DeletedAt: null },
                include: {
                  lessonResources: { where: { DeletedAt: null }, orderBy: { OrderNo: "asc" } },
                },
              },
              Exam: { where: { DeletedAt: null } },
            },
          },
        },
      },
    },
  });

  if (!course) throw new Error(`Course ${courseId} not found`);

  const parts = [];
  parts.push(`Course: ${compact(course.Name)}`);
  parts.push(`Description: ${compact(course.Description)}`);
  if (course.Category?.Name) parts.push(`Category: ${compact(course.Category.Name)}`);

  const skills = (course.courseSkills || [])
    .map((s) => compact(s.SkillName))
    .filter(Boolean);
  if (skills.length) parts.push(`Skills: ${skills.join(", ")}`);

  for (const mod of course.CourseModule || []) {
    parts.push(`Module: ${compact(mod.Title)}`);

    for (const item of mod.ModuleItems || []) {
      for (const lesson of item.CourseLesson || []) {
        parts.push(`Lesson: ${compact(lesson.Title)}`);

        // Keep only resource names (avoid downloading/parsing files for now)
        const resNames = (lesson.lessonResources || [])
          .map((r) => compact(r.Name))
          .filter(Boolean);
        for (const rn of resNames) parts.push(`Resource: ${rn}`);
      }

      for (const exam of item.Exam || []) {
        parts.push(`Exam: ${compact(exam.Title)}. ${compact(exam.Description)}`);
      }
    }
  }

  return clampText(parts.filter(Boolean).join("\n"));
};

export const upsertCourseEmbedding = async (courseId) => {
  const text = await buildCourseEmbeddingText(courseId);
  const vector = await generateEmbedding(text);

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("Embedding API returned an empty vector");
  }

  // Ensure numeric
  const numericVector = vector.map((x) => Number(x) || 0);

  await prisma.courseEmbedding.upsert({
    where: { CourseId: Number(courseId) },
    create: { CourseId: Number(courseId), Vector: numericVector },
    update: { Vector: numericVector },
  });

  return { courseId: Number(courseId), dims: numericVector.length };
};
